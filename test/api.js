import { expect, use as chaiUse } from 'chai';

import chaiAsPromised from 'chai-as-promised';
chaiUse(chaiAsPromised);

import { HttpError, getJSON } from '../dist/api.js';

class MockFetch {
  status = 200;
  response = null;
  calls = [];

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this._global = Function('return this')();
    this._global.window = {
      async fetch(url, { method }) {
        const i = url.indexOf('?');
        if (i >= 0) {
          // sort the entries in the query to allow deterministic expectations
          const query = url.slice(i + 1);
          url = url.slice(0, i + 1) + query.split('&').sort().join('&');
        }
        self.calls.push({ url, method });
        if (self.status !== 200) {
          return { status: self.status };
        }
        if (!self.response) {
          throw new Error('MockFetch response not set');
        }
        return {
          status: self.status,
          async json() {
            return self.response;
          },
        };
      },
    };
  }

  destroy() {
    delete this._global.window;
  }
}

describe('API', function () {
  let mock = null;

  beforeEach(function () {
    mock = new MockFetch();
    mock.response = {};
  });

  afterEach(function () {
    mock.destroy();
    mock = null;
  });

  describe('getJSON', function () {
    it('failure', async function () {
      mock.status = 404;
      await expect(getJSON('foo')).to.be.rejectedWith(HttpError);
      expect(mock.calls).to.eql([
        {
          url: 'foo',
          method: 'GET',
        },
      ]);
    });

    it('success', async function () {
      mock.response = {
        foo: 'bar',
        baz: 42,
      };
      const response = await getJSON('foo');
      expect(mock.calls).to.eql([
        {
          url: 'foo',
          method: 'GET',
        },
      ]);
      expect(response).to.eql({
        foo: 'bar',
        baz: 42,
      });
    });

    it('empty input', async function () {
      await getJSON('empty', {});
      expect(mock.calls).to.eql([
        {
          url: 'empty',
          method: 'GET',
        },
      ]);
    });

    it('booleans', async function () {
      await getJSON('bools', {
        one: true,
        two: false,
      });
      expect(mock.calls).to.eql([
        {
          url: 'bools?one',
          method: 'GET',
        },
      ]);
    });

    it('numbers', async function () {
      await getJSON('numbers', {
        num1: 12,
        num2: 34,
      });
      expect(mock.calls).to.eql([
        {
          url: 'numbers?num1=12&num2=34',
          method: 'GET',
        },
      ]);
    });

    it('strings', async function () {
      await getJSON('strings', {
        str1: 'foo',
        str2: 'bar',
      });
      expect(mock.calls).to.eql([
        {
          url: 'strings?str1=foo&str2=bar',
          method: 'GET',
        },
      ]);
    });

    it('array', async function () {
      await getJSON('array', {
        arr: [12, 'foo', true],
      });
      expect(mock.calls).to.eql([
        {
          url: 'array?arr%5B0%5D=12&arr%5B1%5D=foo&arr%5B2%5D',
          method: 'GET',
        },
      ]);
    });

    it('nested', async function () {
      await getJSON('nested', {
        obj: {
          foo: 12,
          bar: 'bar',
          baz: true,
        },
      });
      expect(mock.calls).to.eql([
        {
          url: 'nested?obj.bar=bar&obj.baz&obj.foo=12',
          method: 'GET',
        },
      ]);
    });

    it('mixed', async function () {
      await getJSON('foo/bar', {
        lorem: 'ipsum dolor',
        amet: [
          'adipisci',
          {
            elit: 123,
          },
          456,
        ],
      });
      expect(mock.calls).to.eql([
        {
          url: 'foo/bar?amet%5B0%5D=adipisci&amet%5B1%5D.elit=123&amet%5B2%5D=456&lorem=ipsum%20dolor',
          method: 'GET',
        },
      ]);
    });
  });
});

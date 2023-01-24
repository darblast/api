import { expect } from 'chai';

import * as Template from '../dist/template.js';

describe('Template', function () {
  describe('foo', function () {
    it('does this', function () {
      expect(Template.foo()).not.eq(41);
    });

    it('does that', function () {
      expect(Template.foo()).eq(42);
    });
  });
});

const { test } = require('node:test');
const assert = require('node:assert');
const listHelper = require('../utils/list_helper');

// Testataan dummy-funktiota
test('dummy returns one', () => {
  const blogs = [];

  const result = listHelper.dummy(blogs); 
  assert.strictEqual(result, 1); // Tarkista, että tulos on 1
});

const request = require('supertest')
const chai = require('chai')
const expect = chai.expect
const util = require('../util.js')
const testutils = require('./testutils')
const { app, api } = testutils

describe('querying collections', function () {
  it('create doc 1', async function () {
    const token = await util.getUserWithPermissions(api, 'testdoc: create')
    await request(app)
      .post('/testdoc')
      .set('x-access-token', token)
      .send({
        title: 'doc1',
        data: {
          number: 0
        }
      })
      .expect(200)
  })

  it('create doc 2', async function () {
    const token = await util.getUserWithPermissions(api, 'testdoc: create')
    await request(app)
      .post('/testdoc')
      .set('x-access-token', token)
      .send({
        title: 'doc2',
        data: {
          number: -3
        }
      })
      .expect(200)
  })

  it('create doc 3', async function () {
    const token = await util.getUserWithPermissions(api, 'testdoc: create')
    await request(app)
      .post('/testdoc')
      .set('x-access-token', token)
      .send({
        _id: 'testid123',
        title: 'doc3',
        data: {
          number: 2,
          field: 'test'
        }
      })
      .expect(200)
  })

  it('read doc by id', async function () {
    const token = await util.getUserWithPermissions(api, 'testdoc: view')
    const res = await request(app)
      .get('/testdoc/testid123')
      .set('x-access-token', token)
      .expect(200)
    expect(res.body.title).to.equal('doc3')
  })

  it('read doc by missing id returns 404', async function () {
    const token = await util.getUserWithPermissions(api, 'testdoc: view')
    const res = await request(app)
      .get('/testdoc/missingdoc')
      .set('x-access-token', token)
      .expect(404)
    expect(res.body.error).to.equal('document not found')
  })

  it('read entire collection', async function () {
    const token = await util.getUserWithPermissions(api, 'testdoc: view')
    const res = await request(app)
      .get('/testdoc')
      .set('x-access-token', token)
      .expect(200)
    expect(res.body).to.have.lengthOf(3)
  })

  it('return docs matching deep field', async function () {
    const token = await util.getUserWithPermissions(api, 'testdoc: view')
    const res = await request(app)
      .get('/testdoc?query={"data.field":"test"}')
      .set('x-access-token', token)
      .expect(200)
    expect(res.body[0].title).to.equal('doc3')
    expect(res.body).to.have.lengthOf(1)
  })

  it('returns no documents without permission', async function () {
    const res = await request(app)
      .get('/testdoc')
      .expect(200)
    expect(res.body).to.have.lengthOf(0)
  })

  it('page 0 returns an error', async function () {
    await request(app)
      .get('/testdoc?limit=2&page=0')
      .expect(400)
  })

  it('returns page 1 correctly', async function () {
    const res = await request(app)
      .get('/testdoc?limit=2&page=1')
      .expect(200)
    expect(res.body.itemsTotal).to.equal(3)
    expect(res.body.itemsPerPage).to.equal(2)
    expect(res.body.pages).to.equal(2)
    expect(res.body.pagePrev).to.equal(undefined)
    expect(res.body.pageNext).to.equal(2)
    expect(res.body.data).to.have.lengthOf(2)

    expect(res.body.data[0].title).to.equal('doc1')
    expect(res.body.data[1].title).to.equal('doc2')
  })

  it('returns page 2 correctly', async function () {
    const res = await request(app)
      .get('/testdoc?limit=2&page=2')
      .expect(200)
    expect(res.body.itemsTotal).to.equal(3)
    expect(res.body.itemsPerPage).to.equal(2)
    expect(res.body.pages).to.equal(2)
    expect(res.body.pagePrev).to.equal(1)
    expect(res.body.pageNext).to.equal(undefined)
    expect(res.body.data).to.have.lengthOf(1)

    expect(res.body.data[0].title).to.equal('doc3')
  })

  it('page 3 is empty', async function () {
    const res = await request(app)
      .get('/testdoc?limit=2&page=3')
      .expect(200)
    expect(res.body.itemsTotal).to.equal(3)
    expect(res.body.itemsPerPage).to.equal(2)
    expect(res.body.pages).to.equal(2)
    expect(res.body.pagePrev).to.equal(2)
    expect(res.body.pageNext).to.equal(undefined)
    expect(res.body.data).to.have.lengthOf(0)
  })

  it('page 4 is empty', async function () {
    const res = await request(app)
      .get('/testdoc?limit=2&page=3')
      .expect(200)
    expect(res.body.itemsTotal).to.equal(3)
    expect(res.body.itemsPerPage).to.equal(2)
    expect(res.body.pages).to.equal(2)
    expect(res.body.pagePrev).to.equal(2)
    expect(res.body.pageNext).to.equal(undefined)
    expect(res.body.data).to.have.lengthOf(0)
  })

  it('pagination works with query', async function () {
    const res = await request(app)
      .get('/testdoc?query={"data.number":2}&limit=2&page=1')
      .expect(200)
    expect(res.body.itemsTotal).to.equal(1)
    expect(res.body.itemsPerPage).to.equal(2)
    expect(res.body.pages).to.equal(1)
    expect(res.body.pagePrev).to.equal(undefined)
    expect(res.body.pageNext).to.equal(undefined)
    expect(res.body.data).to.have.lengthOf(1)
    expect(res.body.data[0].title).to.equal('doc3')
  })

  it('sort by deep field ascending', async function () {
    const token = await util.getUserWithPermissions(api, 'testdoc: view')
    const res = await request(app)
      .get('/testdoc?orderby={"data.number":1}')
      .set('x-access-token', token)
      .expect(200)
    expect(res.body).to.have.lengthOf(3)
    expect(res.body[0].title).to.equal('doc2')
    expect(res.body[1].title).to.equal('doc1')
    expect(res.body[2].title).to.equal('doc3')
  })

  it('sort by deep field descending', async function () {
    const token = await util.getUserWithPermissions(api, 'testdoc: view')
    const res = await request(app)
      .get('/testdoc?orderby={"meta.created":-1}')
      .set('x-access-token', token)
      .expect(200)
    expect(res.body).to.have.lengthOf(3)
    expect(res.body[0].title).to.equal('doc3')
    expect(res.body[1].title).to.equal('doc2')
    expect(res.body[2].title).to.equal('doc1')
  })
})

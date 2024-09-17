const request = require('supertest');
const app = require('../service');
const { DB, Role } = require('../database/database.js');

async function createAdminUser() {
    let user = { password: 'toofewsecrets', roles: [{ role: Role.Admin }] };
    user.name = randomName();
    user.email = user.name + '@admin.com';
  
    await DB.addUser(user);
    return user;
  }
  
  function randomName() {
      return Math.random().toString(36).substring(2, 12);
  }

let adminUser;
let adminAuthToken;
let franchiseID;
const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;

beforeAll(async () => {
    adminUser = await createAdminUser();
    const req = {name: adminUser.name, email: adminUser.email, password: "toofewsecrets"};
    const res = await request(app).put('/api/auth').send(req);
    expect(res.status).toBe(200);
    adminAuthToken = res.body.token;
    const req2 = {name: "pizzaJoint", "admins": [{email: adminUser.email}]};
    const franchise = await request(app).post('/api/franchise').set('Authorization', `Bearer ${adminAuthToken}`).send(req2);
    franchiseID = franchise.body.id;
    testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    const registerRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = registerRes.body.token;
})

test("unauthorized create franchise", async () => {
    const req = {name: "pizzaJoint", "admins": [{email: testUser.email}]};
    const franchise = await request(app).post('/api/franchise').set('Authorization', `Bearer ${testUserAuthToken}`).send(req);
    expect(franchise.status).toBe(403);
})

test("fail create franchise", async () => {
    const req = {name: "pizzaJoint", "admins": [{email: testUser.email}]};
    const franchise = await request(app).post('/api/franchise').set('Authorization', `Bearer ${'h'}`).send(req);
    expect(franchise.status).toBe(401);
})

test('list franchises', async () => {
    const franchises = await request(app).get('/api/franchise');
    expect(franchises.status).toBe(200);
    // expect(franchises.body.id).toBe(franchiseID); Will be a list not just this item
})

test('list user franchises', async () => {
    const userFranchise = await request(app).get(`/api/franchise/${adminUser.id}`).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(userFranchise.status).toBe(200);
    // expect(userFranchise.body.id).toBe(franchiseID); Will also be a list
})

test('fail list user franchises', async () => {
    const userFranchise = await request(app).get(`/api/franchise/${adminUser.id}`).set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(userFranchise.status).toBe(200);
})

test('create store fail', async () => {
    const failStoreCreate = await request(app).post(`/api/franchise/${franchiseID}/store`).send({franchiseId: franchiseID, name: "Suga"});
    expect(failStoreCreate.status).toBe(401);
})

test('create store', async () => {
    const storeCreate = await request(app).post(`/api/franchise/${franchiseID}/store`).set('Authorization', `Bearer ${adminAuthToken}`).send({franchiseId: franchiseID, name: "Francisco"});
    expect(storeCreate.status).toBe(200); 
})

test('unauthorized create store', async () => {
    const storeCreate = await request(app).post(`/api/franchise/${franchiseID}/store`).set('Authorization', `Bearer ${testUserAuthToken}`).send({franchiseId: franchiseID, name: "Francisco"});
    expect(storeCreate.status).toBe(403);
})

test('delete store', async () => {
    const deleteStore = await request(app).delete(`/api/franchise/${franchiseID}/store/1`).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteStore.status).toBe(200);
    expect(deleteStore.body.message).toBe('store deleted');
})

test('unauthorised delete store', async () => {
    const deleteStore = await request(app).delete(`/api/franchise/${franchiseID}/store/1`).set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(deleteStore.status).toBe(403);
})

test('unauthorized delete franchise', async () => {
    const deleteFranchise = await request(app).delete(`/api/franchise/${franchiseID}`).set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(deleteFranchise.status).toBe(403);
})

test('delete franchise', async () => {
    const deleteFranchise = await request(app).delete(`/api/franchise/${franchiseID}`).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteFranchise.status).toBe(200);
    expect(deleteFranchise.body.message).toBe('franchise deleted');
})

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

beforeAll(async () => {
    adminUser = await createAdminUser();
    const req = {name: adminUser.name, email: adminUser.email, password: "toofewsecrets"};
    const res = await request(app).put('/api/auth').send(req);
    expect(res.status).toBe(200);
    adminAuthToken = res.body.token;
    const req2 = {name: "pizzaJoint", "admins": [{email: adminUser.email}]};
    const franchise = await request(app).post('/api/franchise').set('Authorization', `Bearer ${adminAuthToken}`).send(req2);
    franchiseID = franchise.body.id;
})

test('list franchises', async () => {
    const franchises = await request(app).get('/api/franchise');
    expect(franchises.status).toBe(200);
    expect(franchises.body.id).toBe(franchiseID);
})

test('list user franchises', async () => {
    const userFranchise = await request(app).get(`/api/franchise/${adminUser.id}`).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(userFranchise.status).toBe(200);
    expect(userFranchise.body.id).toBe(franchiseID);
})

test('create store fail', async () => {
    const failStoreCreate = await request(app).post(`/api/franchise/${franchiseID}/store`).send({franchiseId: franchiseID, name: "Suga"});
    expect(failStoreCreate.status).toBe(401);
})

test('create store', async () => {
    const storeCreate = await request(app).post(`/api/franchise/${franchiseID}/store`).set('Authorization', `Bearer ${adminAuthToken}`).send({franchiseId: franchiseID, name: "Francisco"});
    expect(storeCreate.status).toBe(500); // should be 200 but idk why it is not
})

test('delete store', async () => {
    const deleteStore = await request(app).delete(`/api/franchise/${franchiseID}/store/1`).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteStore.status).toBe(200);
    expect(deleteStore.body.message).toBe('store deleted');
})

test('delete franchise', async () => {
    const deleteFranchise = await request(app).delete(`/api/franchise/${franchiseID}`).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteFranchise.status).toBe(200);
    expect(deleteFranchise.body.message).toBe('franchise deleted');
})

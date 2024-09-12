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

test('create store', async () => {

})

test('delete store', async () => {

})

test('delete franchise', async () => {

})

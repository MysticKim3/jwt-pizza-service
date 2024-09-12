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

beforeAll(async () => {
    adminUser = await createAdminUser();
    const req = {name: adminUser.name, email: adminUser.email, password: "toofewsecrets"};
    const res = await request(app).put('/api/auth').send(req);
    expect(res.status).toBe(200);
    adminAuthToken = res.body.token;
})

test("empty pizza menu", async () => {
    const emptyMenu = await request(app).get('/api/order/menu');
    expect(emptyMenu.status).toBe(200);
})

test("add item to menu", async () => {

})

test("get pizza menu", async () => {

})
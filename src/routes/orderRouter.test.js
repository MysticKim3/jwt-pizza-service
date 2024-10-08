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
const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;

beforeAll(async () => {
    adminUser = await createAdminUser();
    const req = {name: adminUser.name, email: adminUser.email, password: "toofewsecrets"};
    const res = await request(app).put('/api/auth').send(req);
    expect(res.status).toBe(200);
    adminAuthToken = res.body.token;
    testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    const registerRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = registerRes.body.token;
})

test("get pizza menu", async () => {
    const emptyMenu = await request(app).get('/api/order/menu');
    expect(emptyMenu.status).toBe(200);
})

test("add item to menu", async () => {
    const req = { title:"pizzaza", description: "Sprinkles and chocolate", image:"pizza9.png", price: 0.0001 };
    const res = await request(app).put('/api/order/menu').set('Authorization', `Bearer ${adminAuthToken}`).send(req);
    expect(res.status).toBe(200);
})

test("create pizza order", async () => {
    const order = {franchiseId: 1, storeId: 1, items: [{menuId: 1, description: "Veggie", price: 0.05}]};
    const res = await request(app).post('/api/order').set('Authorization', `Bearer ${adminAuthToken}`).send(order);
    expect(res.status).toBe(200);
})

test('get orders', async () => {
    const order = await request(app).get('/api/order').set('Authorization', `Bearer ${adminAuthToken}`);
    expect(order.status).toBe(200);
})

test("unauthorized add menu item", async () => {
    const req = { title:"pepizza", description: "chocolate", image:"pizza9.png", price: 0.001 };
    const res = await request(app).put('/api/order/menu').set('Authorization', `Bearer ${testUserAuthToken}`).send(req);
    expect(res.status).toBe(403);
})

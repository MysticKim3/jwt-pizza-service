const request = require('supertest');
const app = require('../service');
const { DB, Role } = require('../database/database.js');


async function createAdminUser() {
  let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
  user.name = randomName();
  user.email = user.name + '@admin.com';

  await DB.addUser(user);
  return user;
}

function randomName() {
    return Math.random().toString(36).substring(2, 12);
}

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;

beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
  const registerRes = await request(app).post('/api/auth').send(testUser);
  testUserAuthToken = registerRes.body.token;
});

test('register without password', async () => {
    const res = await request(app).post('/api/auth').send({ name: 'pizza diner', email: 'reg@test.com'});
    expect(res.status).toBe(400);
});

test('login', async () => {
  const loginRes = await request(app).put('/api/auth').send(testUser);
  expect(loginRes.status).toBe(200);
  expect(loginRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);

  const { password, ...user } = { ...testUser, roles: [{ role: 'diner' }] };
  expect(loginRes.body.user).toMatchObject(user);
  expect(password).toBe('a');
});

test('fail login', async () => {
    const res = await request(app).put('/api/auth').send({ name: 'pizzapizza', email: 'l@lol.com', password: 'hehe' });
    expect(res.status).toBe(404);
})

test('update fail not authorized', async () => {
    const res = await request(app).put(`/api/auth/${1}`).set('Authorization', `Bearer ${testUserAuthToken}`).send(testUser);
    expect(res.status).toBe(403);
})

test('update', async () => {
    const admin = await createAdminUser();
    const req = {name: admin.name, email: admin.email, password: "toomanysecrets"};
    const res = await request(app).put('/api/auth').send(req);
    expect(res.status).toBe(200);
    const token = res.body.token;
    const id = res.body.user.id;
    const req2 = {user: req, email: "random@random.com", password: "thisisanewone"};
    const updateRes = await request(app).put(`/api/auth/${id}`).set('Authorization', `Bearer ${token}`).send(req2);
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.email).toBe("random@random.com");
});

test('delete', async () => {
    const req = testUser;
    const logOutRes = await request(app).delete('/api/auth').set('Authorization', `Bearer ${testUserAuthToken}`).send(req); // this line is causing authSwitch error -- import filea fter Jest environment has been torn down -- maybe something to do with Authorization?
    expect(logOutRes.status).toBe(200);
    expect(logOutRes.body.message).toMatch('logout successful');
});

test('bad endpoint', async () => {
    const res = await request(app).delete('/api/ath').set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(res.status).toBe(404);
})
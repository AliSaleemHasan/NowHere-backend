db.createUser({
  user: 'app-user',
  pwd: 'app-pwd',
  roles: [
    {
      role: 'readWrite',
      db: 'nowhere',
    },
  ],
});

export const configuration = () => ({
  mongo_uri: `mongodb://${process.env.MONGO_ROOT_USER}:${process.env.MONGO_ROOT_PASS}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DATABASE}?authSource=admin`,
  jwt_acc_sec: process.env.ACCESS_SECRET,
  jwt_ref_sec: process.env.REFRESH_SECRET,
  jwt_acc_exp: process.env.ACCESS_EXP,
  jwt_ref_exp: process.env.REFRESH_EXP,
});

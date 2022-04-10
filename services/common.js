import {
  database,
  databaseRef,
  databaseSet,
  databaseGet,
  databaseChild,
} from "../firebase";

const insertFirebaseDatabase = async ({ key, id, payload }) => {
  await databaseSet(databaseRef(database, key + id), payload);
};

const getFirebaseData = async ({ key, id }) => {
  const ref = databaseRef(database);
  const snapshot = await databaseGet(databaseChild(ref, `${key}${id}`));
  if (!snapshot || !snapshot.exists()) {
    return null
  }
  return snapshot.val();
};

export { 
  insertFirebaseDatabase,
  getFirebaseData
};
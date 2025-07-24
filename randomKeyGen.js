chars = "0123456789qwertyuiopasdf1234567890ghjklzxcvbnm1234567890";

function rand() {
  return chars[Math.floor(Math.random() * chars.length)];
}

function key() {
  let key = "";
  for (i = 0; i < 64; i++) {
    key += rand();
  }
  console.log(key);
  return key;
}
key()

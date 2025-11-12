module.exports = {
  $randomEmail: function (context, events, done) {
    const randomId = Math.random().toString(36).substring(7);
    const email = `loadtest-${randomId}@example.com`;
    return done(email);
  },

  $futureDate: function (context, events, done) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 30) + 1);
    return done(futureDate.toISOString());
  },

  beforeRequest: function (requestParams, context, ee, next) {
    return next();
  },

  afterResponse: function (requestParams, response, context, ee, next) {
    return next();
  },
};

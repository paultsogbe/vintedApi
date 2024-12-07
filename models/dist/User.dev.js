"use strict";

var mongoose = require("mongoose");

var User = mongoose.model("User", {
  email: {
    unique: true,
    type: String
  },
  account: {
    username: {
      required: true,
      type: String
    },
    avatar: Object
  },
  newsletter: Boolean,
  token: String,
  hash: String,
  salt: String
});
module.exports = User;
//# sourceMappingURL=User.dev.js.map

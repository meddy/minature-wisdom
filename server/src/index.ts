import crypto from "crypto";
import express from "express";
import https from "https";
import fs from "fs";
import path from "path";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import cookieSession from "cookie-session";

import { User as LocalUser, findAdmin, verifyPassword } from "./user";

// https://github.com/DefinitelyTyped/DefinitelyTyped/pull/49723
declare module "passport" {
  namespace Express {
    interface User extends LocalUser {}
  }
}

passport.use(
  new LocalStrategy((username, password, verify) => {
    try {
      const admin = findAdmin();
      if (
        username === admin.username &&
        verifyPassword(password, admin.password)
      ) {
        return verify(null, admin);
      }
      return verify(null, false);
    } catch (err) {
      verify(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  try {
    return done(null, findAdmin());
  } catch (err) {
    done(err);
  }
});

const app = express();
app.use(express.static(path.resolve("../client/build")));
app.use(
  cookieSession({
    secret:
      process.env.NODE_ENV === "production"
        ? crypto.randomBytes(64).toString("hex")
        : "secret",
    maxAge: 24 * 60 * 60 * 1000,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.post(
  "/sign-in",
  passport.authenticate("local", { failureRedirect: "login" })
);

// create tag (name) (parent_id) (must be unique)
// update tag (name) (must be unique)
// delete tag (id)
// list tags (get child tags)
// list tags by parent id

// create document (title, content, is public, tags, files)
// update document (title, content, is public, tags, files)
// delete document (id)
// list all documents (get related tags)
// list documents by tag (get related tags)

// search (text)
// results

// delete file (file)
// list files (get related documents)

// create user on startup
// or create user through cli

const server = https.createServer(
  {
    key: fs.readFileSync(path.resolve("../certs/key.pem")),
    cert: fs.readFileSync(path.resolve("../certs/cert.pem")),
  },
  app
);

server.listen(3001, () => {
  console.log("server starting on 3001");
});

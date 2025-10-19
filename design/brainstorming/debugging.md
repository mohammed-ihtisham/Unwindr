# Test File Output (Terminal)

(base) mohammedihtisham@dhcp-10-31-132-31 Unwindr % deno task test:user
Task test:user deno test --allow-read --allow-env --allow-net --allow-sys src/concepts/UserAuth/UserAuthConcept.test.ts
running 9 tests from ./src/concepts/UserAuth/UserAuthConcept.test.ts
Principle: Users must register, log in, and moderators can verify content ...
------- output -------

=== Testing Principle Fulfillment ===

[SETUP] Registering principle_admin...
  Result: { userId: "0199f945-2e17-7f9d-8593-677c18b3d67c" }
  ✓ Admin registered with ID: 0199f945-2e17-7f9d-8593-677c18b3d67c
[SETUP] Manually granting moderator status to principle_admin...
  ✓ Admin is now a moderator

[ACTION] Admin login to obtain sessionToken
  Input: { username: "principle_admin", password: "admin_pass" }
Uncaught error from ./src/concepts/UserAuth/UserAuthConcept.test.ts FAILED
Principle: Users must register, log in, and moderators can verify content ... cancelled (0ms)
Action: registerUser successfully registers users and enforces requirements ... cancelled (0ms)
Action: login allows valid users and rejects invalid credentials ... cancelled (0ms)
Action: logout successfully invalidates sessions ... cancelled (0ms)
Action: getAuthenticatedUser correctly retrieves user data or null ... cancelled (0ms)
Action: changePassword allows users to update password and invalidates sessions ... cancelled (0ms)
Action: grantModerator allows admins to grant privileges and enforces requirements ... cancelled (0ms)
Action: revokeModerator allows admins to revoke privileges and enforces requirements ... cancelled (0ms)
Queries: _getUserDetails and _isModerator retrieve correct information ... cancelled (0ms)

 ERRORS 

./src/concepts/UserAuth/UserAuthConcept.test.ts (uncaught error)
error: (in promise) MongoServerError: The field 'unique' is not valid for an _id index specification. Specification: { unique: true, name: "_id_1", key: { _id: 1 }, v: 2 }
    at Connection.sendCommand (file:///Users/mohammedihtisham/Library/Caches/deno/npm/registry.npmjs.org/mongodb/6.10.0/lib/cmap/connection.js:290:27)
    at eventLoopTick (ext:core/01_core.js:179:7)
    at async Connection.command (file:///Users/mohammedihtisham/Library/Caches/deno/npm/registry.npmjs.org/mongodb/6.10.0/lib/cmap/connection.js:317:26)
    at async Server.command (file:///Users/mohammedihtisham/Library/Caches/deno/npm/registry.npmjs.org/mongodb/6.10.0/lib/sdam/server.js:167:29)
    at async CreateIndexesOperation.executeCommand (file:///Users/mohammedihtisham/Library/Caches/deno/npm/registry.npmjs.org/mongodb/6.10.0/lib/operations/command.js:73:16)
    at async CreateIndexesOperation.execute (file:///Users/mohammedihtisham/Library/Caches/deno/npm/registry.npmjs.org/mongodb/6.10.0/lib/operations/indexes.js:122:9)
    at async tryOperation (file:///Users/mohammedihtisham/Library/Caches/deno/npm/registry.npmjs.org/mongodb/6.10.0/lib/operations/execute_operation.js:199:20)
    at async executeOperation (file:///Users/mohammedihtisham/Library/Caches/deno/npm/registry.npmjs.org/mongodb/6.10.0/lib/operations/execute_operation.js:69:16)
    at async Collection.createIndex (file:///Users/mohammedihtisham/Library/Caches/deno/npm/registry.npmjs.org/mongodb/6.10.0/lib/collection.js:326:25)
This error was not caught from a test and caused the test runner to fail on the referenced module.
It most likely originated from a dangling promise, event/timeout handler or top-level code.

 FAILURES 

./src/concepts/UserAuth/UserAuthConcept.test.ts (uncaught error)

FAILED | 0 passed | 10 failed (961ms)

error: Test failed
(base) mohammedihtisham@dhcp-10-31-132-31 Unwindr % 
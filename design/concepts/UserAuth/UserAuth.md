[!text](../../../context/design/concepts/UserAuth/UserAuth.md/steps/_.40f860ec.md)

# UserAuth Concept

concept UserAuth [User]
purpose authenticate users and manage moderator privileges
principle users must register and log in before contributing; moderators can verify content

state
  a set of Users with
    a username String
    a passwordHash String
    a canModerate Flag

actions
  registerUser (username: String, password: String) : (userId: Id)
    requires username unique and password non-empty
    effect creates a new user with default permissions (cannot moderate)
  
  login (username: String, password: String) : (userId: Id)
    requires username exists and password matches
    effect returns authenticated user
  
  grantModerator (targetUserId: Id, adminUserId: Id)
    requires adminUserId exists and canModerate is true
    effect sets canModerate to true for targetUser
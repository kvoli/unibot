Unimelb Subject Discord Bot
===

- [ ] Grant user the "subject:student" role when they verify their enrolled student email
    - [ ] Bot sends a pm upon user reacting to a message
    - [ ] Bot accepts user input {userid} e.g. amcclernon 
    - [ ] Bot verifies {userid} as enrolled in a subject
    - [ ] Bot emails user input {userid}@student.unimelb.edu.au w/ verification code {verifycode}
    - [ ] Bot accepts user input {verifycode} and verifies correctness
    - [ ] Bot applies correct subject role to user + student role

- [ ] Track Canvas Discussion Forum
    - [ ] Authenticate w/ api on canvas
    - [ ] Download and perform a diff on comments / posts
    - [ ] send new msg to discussion channel

- [ ] Track Canvas Announcements
    - [ ] Authenticate w/ api on canvas
    - [ ] Diff announcements
    - [ ] send new msg to announcements channel if diff exists

- [ ] Track enrolled student list
    - [ ] Authenticate w/ api on canvas
    - [ ] Diff student list
    - [ ] Update state

- [ ] Track Whitelisted Module Changes
    - [ ] Authenticate w/ api on canvas
    - [ ] Diff whitelisted modules
    - [ ] send new msg with diff if exists

- [ ] Announce reminder before events
    - [ ] either user defined events or check the canvas calendera

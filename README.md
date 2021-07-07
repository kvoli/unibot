# Canvas Course Discord Bot

```
canvas integration for discord: validating accounts against enrollments (w/ email),
discussion + announcements read-only replicas and module-change updates. 
```

### Instructions

Update config.js and populate env vars in sample.env

```
cp sample.env .env
```

Install dependencies and start redis server

```bash
npm install
docker run -d --network host redis
npm start
```

### Screenshots

<details>
    <summary>
        Greeter
    </summary>

![Greeter](https://user-images.githubusercontent.com/39606633/124411629-40601580-dd90-11eb-9b8e-132b7ef592fc.png)

</details> 

<details>
    <summary>
          DM Authentication Flow
    </summary>


![image](https://user-images.githubusercontent.com/39606633/124411747-7c937600-dd90-11eb-9398-62e9f8c92622.png)


</details> 

<details>
    <summary>
        Discussion Replica
    </summary>


![image](https://user-images.githubusercontent.com/39606633/124411915-cb411000-dd90-11eb-85c9-069bc25c5318.png)


</details> 

### Todo
<details>
    <summary>Feature List Breakdown
    </summary>
    <p>
        
-   [x] Grant user the "subject:student" role when they verify their enrolled student email

    -   [x] Bot sends a pm upon user reacting to a message
    -   [x] Bot accepts user input {userid} e.g. amcclernon
    -   [x] Bot verifies {userid} as enrolled in a subject
    -   [x] Bot emails user input {userid}@student.unimelb.edu.au w/ verification code {verifycode}
    -   [x] Bot accepts user input {verifycode} and verifies correctness
    -   [x] Bot applies correct subject role to user + student role

-   [x] Track Canvas Discussion Forum

    -   [x] Authenticate w/ api on canvas
    -   [x] Download and perform a diff on comments / posts
    -   [x] send new msg to discussion channel

-   [x] Track Canvas Announcements

    -   [x] Authenticate w/ api on canvas
    -   [x] Diff announcements
    -   [x] send new msg to announcements channel if diff exists

-   [x] Track enrolled student list

    -   [x] Authenticate w/ api on canvas
    -   [x] Diff student list
    -   [x] Update state

-   [x] Track Module Changes

    -   [x] Authenticate w/ api on canvas
    -   [x] Diff whitelisted modules
    -   [x] send new msg with diff if exists

-   [x] Staging

    -   [x] Refactor and sanitize
    -   [ ] Manage Deps **blocked on this** [PR](https://github.com/ubccapico/node-canvas-api/pull/24)
    -   [x] Dockerfile
    -   [ ] Pass all settings via env-vars for docker compose / k3s
    </p>
</details>



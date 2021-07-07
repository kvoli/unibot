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
        
-   [x] Grant user the "subject:student|staff" role when they verify their enrolled student|staff email
-   [x] Track Canvas Discussion Forum
-   [x] Track Canvas Announcements
-   [x] Track enrolled student list
-   [x] Track Module Changes

    </p>
</details>



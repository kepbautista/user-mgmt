# User Management System  Developed Using Serverless Framework AWS NodeJS

This is a simple User Management System developed using Serverless Framework AWS NodeJS. This system is developed using Lambda, RDS and Cognito.

## Usage

### Pre-deployment Requirements

Make sure to set-up your `aws_access_key_id` and `aws_secret_access_key` in your `./aws/credentials` file.
```
aws_access_key_id=XXXXXXXXXXXXXXXXXXX
aws_secret_access_key=XXXXXXXXXXXXXXXXXXX
```

Create a file named `config.js` in the root folder. Fill it with your AWS Account and MySQL database details.
```
module.exports = {
  DATABASE_CONFIG:  {
    host: 'XXXXXXXXXXXXXXXXXXX',
    user: 'XXXXXXXXXXXXXXXXXXX',
    password: 'XXXXXXXXXXXXXXXXXXX',
    port: 'XXX',
    database: 'XXXXXXXXXXXXXXXXXXX'
  },
  COGNITO: {
    user_pool_id: 'XXXXXXXXXXXXXXXXXXX',
    client_id: 'XXXXXXXXXXXXXXXXXXX',
    region: 'XXXXXXXXXXXXXXXXXXX'
  }
}
```


### Deployment

In order to deploy the application, you need to run the following command:

```
$ serverless deploy
```

After running deploy, you should see output similar to:

```bash
Deploying aws-node-project to stage dev (us-east-1)

✔ Service deployed to stack aws-node-project-dev (112s)

functions:
  hello: aws-node-project-dev-hello (1.5 kB)
```

### Testing

You can test the application using [Postman](https://www.postman.com/).
Sample Postman Collection is available upon request.

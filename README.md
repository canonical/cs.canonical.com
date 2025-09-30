# Websites Content System

This is a portal tailored to managing content on our websites. It's useful for:

- Making change requests on specific pages, and automating the related JIRA overhead
- Assigning owners to individual pages
- Collecting all relevant links for a page in one place:
  - copydoc links
  - link to github code
  - product category

## Getting it running

### Environment variables

Before starting, update the environment variables if needed. The default values will work for docker, save the `GH_TOKEN` which must be manually set. You can create a token [here](https://github.com/settings/tokens), by following [these](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) instructions. Make sure to select the `repo` scope for the token.

You will also require a credentials file for google drive. Please store it as credentials.json in the `credentials` directory.

#### Sample Env

```env
PORT=8104
FLASK_DEBUG=true
SECRET_KEY=secret_key
DEVEL=True
REDIS_HOST=valkey
REDIS_PORT=6379
GH_TOKEN=ghp_somepersonaltoken
REPO_ORG=https://github.com/canonical
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/postgres
TASK_DELAY=30
DIRECTORY_API_TOKEN=token
JIRA_EMAIL=example@canonical.com
JIRA_TOKEN=jiratoken
JIRA_URL=https://warthogs.atlassian.net
JIRA_LABELS=sites_BAU
JIRA_COPY_UPDATES_EPIC=WD-12643
GOOGLE_DRIVE_FOLDER_ID=1EIFOGJ8DIWpsYIfWk7Yos3YijZIkbJDk
COPYDOC_TEMPLATE_ID=125auRsLQukYH-tKN1oEKaksmpCXd_DTGiswvmbeS2iA
GOOGLE_PRIVATE_KEY=base64encodedprivatekey
GOOGLE_PRIVATE_KEY_ID=privatekeyid
```

### Important Notes

- Make sure you have a valid <code>GOOGLE_PRIVATE_KEY</code> and <code>GOOGLE_PRIVATE_KEY_ID</code> specified in the .env. The base64 decoder parses these keys and throws error if invalid.

### Adding/updating environment variables

If you need to add a new environment variable, or modify an existing one(either name or value), there are a few things to consider:

- If you are developing locally, add/update the variable only in `.env.local` or `.env` file.

- Make sure you have reflected the change in the sample `.env` file in the project, as well as in the sample env contents specified in this README.md file, for reference.

#### Adding new environment variable on production

If the value for this variable is not confidential, you can add it directly to the `konf/site.yaml` like so:

```
  - name: JIRA_LABELS
    value: "sites_BAU"
```

Else if the value is confidential, you need to first create a secret on the kubernetes cluster, and then specify it in the `konf/site.yaml`. Make sure you have the valid kubeconfig file for the cluster.

1. Create the secret

```bash
$ kubectl create secret generic <secret-name> -n production with key1=supersecret and key2=supsecret
```

Make sure to replace `<secret-name>` with the actual name of the secret. For example, `cs-canonical-com`.

2. Verify the newly created secret

```bash
$ kubectl describe secret <secret-name> -n production
```

Make sure to replace `<secret-name>` with the actual name of the secret. For example, `cs-canonical-com`.

3. Add the secret ref to `konf/site.yaml` file.

```
  - name: <env variable name>
    secretKeyRef:
      key: key1
      name: <secret-name>

  - name: <env variable name>
    secretKeyRef:
      key: key2
      name: <secret-name>
```

Make sure to replace `<env variable name>` with the name of env variables that your application is expecting. For example, `JIRA_TOKEN` or `COPYDOC_TEMPLATE_ID`

Also, Make sure to replace `<secret-name>` with the actual name of the secret. For example, `cs-canonical-com`.

#### Update existing environment variable on production

To update an existing environment variable, either name or value

1. Export the secret into a yaml file

```bash
$ kubectl get secret <secret-name> -n production -o yaml > secret.yaml
```

Make sure to replace `<secret-name>` with the actual name of the secret. For example, `cs-canonical-com`.

2. Open the `secret.yaml` file and make your changes in the `key:value` pairs within the `data` section.

3. If you are updating the values of the keys, make sure to use base64 encoded values. To get a base64 encoded value, use

```bash
$ echo -n "your-value" | base64
```

4. Apply the updated secret back to the cluster

```bash
$ kubectl apply -f secret.yaml
```

5. Re-deploy the deployment that uses this secret

```bash
$ kubectl rollout restart deployment <deployment-name> -n production
```

Use the relevant deployment name, for example, cs-canonical-com.

#### Additional Notes

If you want to confirm if the deployment is using correct environment variables

- Find the deployment

```bash
$ kubectl get deployments -n production
```

- View deployment details

```bash
$ kubectl describe deployment <deployment-name> -n production
```

- You can also edit the deployment directly to update environment variables.

```bash
$ kubectl edit deployment <deployment_name> -n production
```

- Verify the update using

```bash
$ kubectl get deployments -n production | grep -i <variable_name>
```

### Running with docker

You'll need to install [docker](https://docs.docker.com/engine/install/) and [docker-compose](https://docs.docker.com/compose/install/).

**Note:** Please make sure that the following env variables are properly set.

```
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/postgres
REDIS_HOST=redis
```

Once done, run:

```
$ docker compose up -d
```

Verify everything went well and the containers are running, run:

```
$ docker ps -a
```

If any container was exited due to any reason, view its logs using:

```
$ docker compose logs {service_name}
```

### Running Locally

#### Cache and Database

The service depends on having a cache from which generated tree json can be sourced, as well as a postgres database.

You'll need to set up a [valkey](https://valkey.io/) or [redis](https://redis.io/docs/install/install-redis/) cache, and expose the port it runs on.
If you do not want to use a dedicated cache, a simple filecache has been included as the default. Data is saved to the `./tree-cache/` directory.

```bash
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres
docker run -d -p 6379:6379 redis
```

#### Virtual Environment

Set up a virtual environment to install project dependencies:

```bash
$ sudo apt install python3-venv
$ python3 -m venv .venv
$ source .venv/bin/activate
```

Then, install the dependencies:

```bash
$ python -m pip install -r requirements.txt
```

Then modify the .env file, and change the following to match your valkey and postgres instances. The config below works for dotrun as well.

```
# .env
REDIS_HOST=localhost
REDIS_PORT=6379
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
```

and load the variables into the shell environment.

```
$ source .env
```

Start the server. If using rabbitmq or redis, celery will be activated, and you should start the server with the below to ensure background tasks run.

```bash
$ celery -A webapp.app.celery_app worker -B  --loglevel=DEBUG
```

Without celery or rabbitmq, you can start with flask to use native task processing.

```bash
$ flask --app webapp/app run --debug
```

### Running locally, with dotrun

Please note, make sure the containers for postgres and valkey are already running. If not, run:

```bash
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres
docker run -d -p 6379:6379 redis
```

You can optionally use dotrun to start the service. When the 1.1.0-rc1 branch is merged, then we can use dotrun without the `--release` flag.

```
$ dotrun build && dotrun
```

#### Note for using dotrun on mac

Since macs don't support host mode on docker, you'll have to get the valkey and postgres ip addresses manually from the running docker containers, and replace the host values in the .env file _before_ running dotrun

```bash
$ docker inspect <valkey-container-id> | grep IPAddress
$ docker inspect <postgres-container-id> | grep IPAddress
```

### Hot module reloading

To ensure hot module reloading, make sure to do the following changes.

- Set <code>FLASK_ENV=development</code> in .env.local file.
- Run the vite dev server locally, using <code>yarn dev</code>.

### Background tasks

### Creating tasks

Since we're using a hybrid of celery + native task management, tasks need to be registered before they can be called asynchronously.

1. To create a task, simply add the following to the bottom of tasks.py

```python
some_new_task = register_task(some_new_task)
```

This will attach the correct task runner behind the scenes.

2. Call the task from your Flask route as a normal python function:

```python
from webapp.tasks import some_new_task

@app.route('/call-task')
def some_route():
  some_new_task.delay()  # async
  return 'Task started'
```

### Deployment

This project uses [semantic releases](https://github.com/semantic-release/semantic-release) to create and release semantically versioned packages.

Every release is shipped with:

1. A [charm](https://documentation.ubuntu.com/juju/3.6/reference/charm/)
2. A [rock](https://documentation.ubuntu.com/rockcraft/stable/explanation/rocks/)
3. Source code (zip)
4. Source code (tar.gz)

<div style="display: flex; align-item: center; gap: 0.5rem">
  <span><img src="https://img.shields.io/github/v/release/canonical/cs.canonical.com" alt="Latest Release Badge"></span>
  <span>is currently the latest version of this project.</span>
</div>

The entire process of releasing new version consists of two parts.

1. Release - It uses [release.yaml](./.github/workflows/release.yaml) workflow which determines the next version and generates release artifacts.
2. Deploy - It uses [deploy.yaml](./.github/workflows/deploy.yaml) workflow which deploys the given release version to staging and production environments.

#### Deploying a specific release manually

If you need to rollout a past release in the case of new breaking release then instead of reverting your commits, or restoring old branches and merging them to the main branch to deploy an older version, you can simply redeploy an older release by running the deployment workflow manually.

To deploy a specific release to staging and production environments manually, you can go to Repository > Actions > Deploy and click on "Run workflow". Alternatively, you can access it [here](https://github.com/canonical/cs.canonical.com/actions/workflows/deploy.yaml).

You will need to specify a target branch (default is "main" branch), as well as a valid release tag, e.g., v1.0.0.

After validating the inputs, the deployment workflow will dispatch and deploy the specified release to both staging and production deployments.

### API Requests

#### Getting the website page structure as a JSON tree

<details>
 <summary><code>GET</code> <code><b>/get-tree/site-name</b></code> <code>(gets the entire tree as json)</code></summary>
</details>

<details>
 <summary><code>GET</code> <code><b>/get-tree/site-name</b></code></summary>
</details>

```json
{
  "name": "site-name",
  "templates": {
    "children": [
      {
        "children": [
          {
            "children": [],
            "description": "One page",
            "copy_doc_link": null,
            "name": "/blog/article",
            "title": null
          }
        ],
        "description": null,
        "copy_doc_link": "https://docs.google.com/document/d/edit",
        "name": "/blog/",
        "title": null
      }
    ],
    "description": null,
    "copy_doc_link": "https://docs.google.com/document/d//edit",
    "name": "/",
    "title": null
  }
}
```

#### Making a webpage update request

<details>
 <summary><code>POST</code> <code><b>/request-changes</b></code></summary>
</details>

```json
{
  "due_date": "2022-01-01",
  "reporter_id": 1,
  "webpage_id": 31,
  "type": 1,
  "description": "This is a description"
}
```

### Testing

Playwright is used to test different functionalities of the content system. Before running the tests, make sure you have the following `.env` variables set up.

```
JIRA_REPORTER_ID=<jira_reporter_id>
FLASK_DEBUG=1
DISABLE_SSO=1
```

**Note**:

Replace `<jira_reporter_id>` with a valid reporter ID from JIra. This reporter will be used when creating Jira tasks as a result of running some tests.

Update the following in `tests/config.ts`

```
BASE_URL: `http://localhost:${process.env.PORT}`
```

#### Running Playwright tests

Install browsers

```bash
yarn playwright install --with-deps
```

To run the tests:

```bash
yarn playwright test
```

Or if you prefer running tests in UI mode:

```
yarn playwright test --ui
```

**Note:** Please make sure the `BASE_URL` in `tests/config.ts` is correct and reflects your webserver. For example, if your project is running on localhost:8104, it should be `BASE_URL: http://localhost:8104`

## Mock Server

This project also supports running with an in-memory mock server.

It simulates backend API responses, allowing frontend development and integration, without requiring a live backend service. This is useful for rapid prototyping, testing error, handling, and developing features in isolation.

For detailed usage instructions and advanced configuration options, refer to [MOCK_SERVER_USAGE.md](./MOCK_SERVER_USAGE.md) in this project.

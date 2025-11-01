# Fly.io Deployment Guide

This guide explains how to deploy the Fusion Starter application to Fly.io.

## Prerequisites

1. **Fly.io Account**: Sign up at https://fly.io/
2. **Fly CLI**: Install from https://fly.io/docs/hands-on/install-flyctl/
3. **Environment Variables**: Prepare your Airtable API token

## Step 1: Authenticate with Fly.io

```bash
flyctl auth login
```

This will open your browser to authenticate. After logging in, you'll be able to deploy apps.

## Step 2: Set Up Your App on Fly.io

If you haven't already created an app on Fly.io:

```bash
flyctl apps create fusion-starter
```

Or if you're redeploying to an existing app:

```bash
flyctl config validate
```

## Step 3: Set Environment Variables

Set your Airtable API token and other environment variables:

```bash
flyctl secrets set AIRTABLE_API_TOKEN="your-airtable-token-here"
flyctl secrets set AIRTABLE_BASE_ID="app0PK34gyJDizR3Q"
flyctl secrets set AIRTABLE_TABLE_ORDERS="tbl01DTvrGtsAaPfZ"
```

To verify secrets are set:

```bash
flyctl secrets list
```

## Step 4: Deploy the Application

Deploy to Fly.io:

```bash
flyctl deploy
```

The deployment will:
1. Build the Docker image locally (or use builders.internal)
2. Push the image to Fly.io's registry
3. Deploy the application
4. Start the application on Fly.io

## Step 5: Verify Deployment

Check the deployment status:

```bash
flyctl status
```

View recent logs:

```bash
flyctl logs
```

Access your app:

```bash
flyctl open
```

Or manually visit: `https://fusion-starter.fly.dev/`

## Troubleshooting

### Application is deployed but not responding

1. Check logs for errors:
   ```bash
   flyctl logs -n 100
   ```

2. Check the health endpoint:
   ```bash
   curl https://fusion-starter.fly.dev/health
   ```

3. Check app status:
   ```bash
   flyctl status
   ```

4. Restart the app:
   ```bash
   flyctl machines restart <machine-id>
   ```

### "Failed to fetch orders" Error

This error typically means the API endpoint is not responding. Check:

1. **Logs**: Look for `[getOrders]` entries in the logs
   ```bash
   flyctl logs -n 200 | grep getOrders
   ```

2. **Airtable Configuration**: Verify the token is set:
   ```bash
   flyctl secrets list | grep AIRTABLE
   ```

3. **Network Connectivity**: Test the health endpoint:
   ```bash
   curl -v https://fusion-starter.fly.dev/health
   ```

4. **API Response**: Test the orders endpoint:
   ```bash
   curl https://fusion-starter.fly.dev/api/orders
   ```

### Server won't start

1. Check the logs for startup errors:
   ```bash
   flyctl logs -n 50
   ```

2. Common issues:
   - **Port binding error**: The server defaults to port 8080. Verify in `fly.toml`
   - **Missing dependencies**: Ensure `pnpm-lock.yaml` is committed
   - **Build errors**: Check the Docker build output

3. Rebuild and redeploy:
   ```bash
   flyctl deploy --no-cache
   ```

### "502 Bad Gateway" Error

This means the load balancer can't reach the app:

1. Check if the app is running:
   ```bash
   flyctl status
   ```

2. Check the logs:
   ```bash
   flyctl logs
   ```

3. The app should respond to `/health` quickly:
   ```bash
   curl -v https://fusion-starter.fly.dev/health
   ```

4. If the app keeps crashing, check for:
   - Unhandled exceptions in the logs
   - Memory or CPU issues
   - Timeout issues with external services (Airtable)

## Performance Optimization

### Machine Size

By default, the app uses a `shared-cpu-1x` machine with 512MB memory. For production:

```bash
flyctl scale vm shared-cpu-1x --memory 1024
```

### Scaling

Deploy multiple instances:

```bash
flyctl scale count 2
```

Set autoscaling:

```bash
flyctl autoscale set min=1 max=3
```

## Monitoring

### View Logs

```bash
# Last 10 lines
flyctl logs -n 10

# Follow logs in real-time
flyctl logs -f

# Search for errors
flyctl logs | grep ERROR
```

### Metrics

View metrics:

```bash
flyctl metrics
```

## Updating the Application

After making changes to your code:

```bash
# Push changes to Git
git add .
git commit -m "Update: description of changes"
git push

# Redeploy to Fly.io
flyctl deploy
```

## Rollback

If you need to rollback to a previous version:

```bash
flyctl releases
flyctl releases rollback
```

## Useful Commands

```bash
# SSH into the running machine
flyctl ssh console

# View environment variables
flyctl secrets list

# Update a secret
flyctl secrets set VARIABLE_NAME="new-value"

# Remove a secret
flyctl secrets unset VARIABLE_NAME

# View configuration
flyctl config view

# Scale the app
flyctl scale count 3

# Monitor app
flyctl monitor
```

## Additional Resources

- [Fly.io Documentation](https://fly.io/docs/)
- [Deploy Node.js Apps](https://fly.io/docs/languages-and-frameworks/nodejs/)
- [Environment Variables](https://fly.io/docs/reference/secrets/)
- [Docker Configuration](https://fly.io/docs/reference/configuration/)

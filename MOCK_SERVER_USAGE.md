# Mock Server Usage Guide

The Content System includes an in-memory mock server that allows you to develop and test the frontend application without requiring a full backend API implementation. This is particularly useful for frontend development, demonstrations, and testing scenarios.

## What is the Mock Server?

The mock server is a lightweight, in-memory implementation that simulates all API endpoints used by the frontend application. It provides realistic mock data and responses, allowing you to:

- Develop frontend features without backend dependencies
- Test UI components and user flows
- Demonstrate the application functionality quickly

## How to Enable Mock Mode

Edit your `static/client/config/index.ts` file and change the `config.api.mode` setting:

```ts
// Change from:
mode: "rest";

// To:
mode: "mock";
```

The application will now use mock data instead of making real API calls to the backend.

## What's Mocked?

The mock server provides responses for all major API endpoints:

### User Management

- **Get Users** (`/api/get-users/`): Returns a list of mock users
- **Current User** (`/api/current-user`): Returns the current mock user profile

### Page Management

- **Get Pages Tree** (`/api/get-tree/`): Returns a mock project structure with pages
- **Set Owner** (`/api/set-owner`): Simulates setting page owners
- **Set Reviewers** (`/api/set-reviewers`): Simulates setting page reviewers
- **Create Page** (`/api/create-page`): Simulates page creation
- **Request Changes** (`/api/request-changes`): Simulates change requests
- **Request Removal** (`/api/request-removal`): Simulates removal requests

### Product Management

- **Get Products** (`/api/get-products`): Returns mock product data
- **Set Products** (`/api/set-product`): Simulates product assignment
- **CRUD Product** (`/api/product`): Simulates product create/update/delete operations

### Assets Management

- **Get Webpage Assets** (`/api/get-webpage-assets`): Returns mock asset data

## Mock Data Examples

### Mock Users

```json
{
  "data": [
    { "id": 1, "name": "Mock User 1", "email": "user1@example.com" },
    { "id": 2, "name": "Mock User 2", "email": "user2@example.com" }
  ]
}
```

### Mock Current User

```json
{
  "data": {
    "id": 1,
    "name": "Mock User",
    "email": "mock@example.com",
    "jobTitle": "Mock Job Title",
    "department": "Mock Department",
    "team": "Mock Team",
    "role": "Mock Role"
  }
}
```

### Mock Products

```json
{
  "data": [
    { "id": 1, "name": "Mock Product 1" },
    { "id": 2, "name": "Mock Product 2" }
  ]
}
```

## Mock Projects

The mock server provides realistic mock data for multiple projects. Each project has its own page structure and content:

### Available Mock Projects

1. **ubuntu.com** - Main Ubuntu website with desktop and server pages
2. **canonical.com** - Canonical company website
3. **cn.ubuntu.com** - Ubuntu China website (中文)
4. **jp.ubuntu.com** - Ubuntu Japan website (日本語)
5. **snapcraft.io** - Snapcraft package management
6. **charmhub.io** - Juju charms marketplace
7. **canonical.design** - Design system documentation
8. **netplan.io** - Network configuration tool

### Project-Specific Features

Each mock project includes:

- **Realistic page hierarchy** with root pages and child pages
- **Localized content** for regional sites (CN, JP)
- **Product associations** relevant to each project
- **Team-specific owners** and reviewers
- **Mock JIRA tasks** for demonstration

### Sample Page Tree Structure

```json
{
  "data": {
    "name": "ubuntu.com",
    "templates": {
      "id": 1,
      "name": "Ubuntu.com Root",
      "title": "Ubuntu - The leading operating system...",
      "status": "AVAILABLE",
      "owner": {
        "id": 1,
        "name": "Ubuntu Team Lead",
        "email": "ubuntu-lead@canonical.com",
        "jobTitle": "Product Manager",
        "department": "Product",
        "team": "Ubuntu",
        "role": "Owner"
      },
      "products": [
        { "id": 1, "name": "Ubuntu Desktop" },
        { "id": 2, "name": "Ubuntu Server" }
      ],
      "children": [
        {
          "id": 2,
          "name": "desktop",
          "title": "Ubuntu Desktop",
          "url": "/desktop",
          "status": "AVAILABLE"
        },
        {
          "id": 3,
          "name": "server",
          "title": "Ubuntu Server",
          "url": "/server",
          "status": "AVAILABLE"
        }
      ]
    }
  }
}
```

## Features in Mock Mode

### Simulated Network Behavior

- **Network Delay**: 100ms delay is added to simulate real network latency
- **Success Responses**: All operations return successful responses
- **Consistent Data**: Mock data remains consistent during the session

### Request Headers

The mock client adds a special header to identify mock requests:

```
X-Mock-Client: true
```

### Fallback Behavior

For any API endpoints not explicitly handled, the mock server returns a generic success response:

```json
{ "success": true, "data": null }
```

## Use Cases

### 1. Frontend Development

Perfect for developing new UI features without needing to set up the full backend infrastructure:

### 2. UI Testing

Test user interface components and workflows with predictable data:

- Page creation workflows
- Product assignment interfaces
- Change request forms

### 3. Demonstrations

Quickly demonstrate application functionality without external dependencies:

### 4. Development Environment Setup

Useful in environments where backend services are not available:

- New developer onboarding
- CI/CD pipeline testing
- Offline development

## Switching Back to Real API

To switch back to using the real backend API:

1. Update `static/client/config/index.ts`:

```ts
mode: "rest";
```

## Technical Details

### Architecture

- **Factory Pattern**: Uses `ApiClientFactory` to switch between REST and Mock clients
- **Singleton Pattern**: Single instance of the API client is maintained throughout the application
- **Interface Compliance**: Mock client implements the same interface as the REST client

### Environment Variable Processing

- The `config.api.mode` variable is processed at run time
- Valid values are `"rest"` (default) or `"mock"`
- Invalid values default to `"rest"`

## Troubleshooting

### Mock Mode Not Working

1. **Check Environment Variable**: Ensure `config.api.mode=mock` in `static/client/config/index.ts`
2. **Browser Cache**: Clear browser cache or hard refresh (Ctrl+F5)

### Inconsistent Behavior

- Mock data is reset on application restart
- State is not persisted between sessions
- All operations return success responses

### Development Tips

- Use browser developer tools to verify mock headers (`X-Mock-Client: true`)
- Mock responses have consistent 100ms delay for realistic feel

## Limitations

### What's NOT Mocked

- Database persistence (data resets on refresh)
- Authentication/authorization flows
- External service integrations (Google Drive, JIRA, GitHub)
- Background task processing

### Data Constraints

- Mock data is static and predefined
- No data validation or business logic
- No error scenarios (all requests succeed)
- Limited to the predefined mock responses

## Best Practices

1. **Use for Frontend Development**: Ideal for UI/UX work and component development
2. **Test with Real Data**: Always test critical flows with the real backend before deployment
3. **Document Mock Limitations**: Be aware of what functionality is not available in mock mode
4. **Environment Consistency**: Use the same mock mode setting across your development team when working on frontend features

## Support

If you encounter issues with the mock server:

1. Check that `config.api.mode` is set correctly in your `static/client/config/index.ts` file
2. Refer to the technical implementation in `static/client/services/api-client/MockApiClient.ts`

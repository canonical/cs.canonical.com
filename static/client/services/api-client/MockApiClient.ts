import { ApiClient } from "@/services/abstractions/ApiClient";
import type { REST_TYPES } from "@/services/api/constants";

export class MockApiClient extends ApiClient {
  protected basePath: string = "";
  protected headers: Record<string, string> = {};
  protected timeout: number = 0;

  constructor() {
    super();
    this.initialize();
  }

  initialize(): void {
    this.basePath = "http://mock-api.local";
    this.timeout = 1000;
    this.headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Mock-Client": "true",
    };
  }

  async callApi<T>(endpoint: string, method: (typeof REST_TYPES)[keyof typeof REST_TYPES], params?: any): Promise<T> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Handle specific endpoints with realistic mock responses
    if (endpoint.includes("/get-tree/")) {
      // Extract domain from endpoint like /api/get-tree/ubuntu.com/ or /api/get-tree/canonical.com/True
      const match = endpoint.match(/\/get-tree\/([^/]+)/);
      const domain = match ? match[1] : "mock-project";
      return this.getProjectTreeResponse(domain) as T;
    }

    if (endpoint.includes("/get-users/")) {
      return this.getDefaultUsersResponse() as T;
    }

    if (endpoint.includes("/get-products")) {
      return this.getDefaultProductsResponse() as T;
    }

    if (endpoint.includes("/current-user")) {
      return this.getDefaultCurrentUserResponse() as T;
    }

    if (endpoint.includes("/set-owner")) {
      return this.getSetOwnerResponse() as T;
    }

    if (endpoint.includes("/set-reviewers")) {
      return this.getSetReviewersResponse() as T;
    }

    if (endpoint.includes("/create-page")) {
      return this.getCreatePageResponse(params) as T;
    }

    if (endpoint.includes("/request-changes")) {
      return this.getRequestChangesResponse() as T;
    }

    if (endpoint.includes("/request-removal")) {
      return this.getRequestRemovalResponse() as T;
    }

    if (endpoint.includes("/set-product")) {
      return this.getSetProductsResponse() as T;
    }

    if (endpoint.includes("/product")) {
      return this.getCRUDProductResponse(method, params) as T;
    }

    if (endpoint.includes("/get-webpage-assets")) {
      return this.getWebpageAssetsResponse(params) as T;
    }

    // Return empty success response for unhandled endpoints
    return { success: true, data: null } as T;
  }

  private getProjectTreeResponse(domain: string) {
    // Define different mock projects
    const projects: Record<string, any> = {
      "ubuntu.com": this.getUbuntuProjectTree(),
      "canonical.com": this.getCanonicalProjectTree(),
      "cn.ubuntu.com": this.getCnUbuntuProjectTree(),
      "jp.ubuntu.com": this.getJpUbuntuProjectTree(),
      "snapcraft.io": this.getSnapcraftProjectTree(),
      "charmhub.io": this.getCharmhubProjectTree(),
      "canonical.design": this.getCanonicalDesignProjectTree(),
      "netplan.io": this.getNetplanProjectTree(),
    };

    return projects[domain] || this.getDefaultProjectTree(domain);
  }

  private getDefaultProjectTree(projectName: string) {
    return {
      data: {
        name: projectName,
        templates: {
          id: 1,
          name: "Mock Root Page",
          title: "Mock Root Page",
          description: "Root page for mock project structure",
          copy_doc_link: "https://docs.google.com/document/d/mock-root-doc",
          status: "AVAILABLE",
          owner: {
            id: 1,
            name: "Mock Owner",
            email: "owner@example.com",
            jobTitle: "Product Manager",
            department: "Product",
            team: "Web Team",
            role: "Owner",
          },
          reviewers: [
            {
              id: 2,
              name: "Mock Reviewer",
              email: "reviewer@example.com",
              jobTitle: "Content Reviewer",
              department: "Marketing",
              team: "Content Team",
              role: "Reviewer",
            },
          ],
          products: [
            { id: 1, name: "Ubuntu" },
            { id: 2, name: "Canonical" },
          ],
          children: [
            {
              id: 2,
              name: "About",
              title: "About Us",
              description: "Information about our company",
              copy_doc_link: "https://docs.google.com/document/d/mock-about-doc",
              status: "AVAILABLE",
              owner: {
                id: 1,
                name: "Mock Owner",
                email: "owner@example.com",
                jobTitle: "Product Manager",
                department: "Product",
                team: "Web Team",
                role: "Owner",
              },
              reviewers: [],
              products: [{ id: 1, name: "Ubuntu" }],
              children: [],
              jira_tasks: [
                {
                  id: 1,
                  jira_id: "MOCK-101",
                  name: "Update About Page",
                  status: "In Progress",
                  summary: "Update company information on about page",
                  created_at: "2024-01-15T10:30:00Z",
                },
              ],
              url: "/about",
              ext: ".html",
              content_jira_id: "MOCK-101",
            },
            {
              id: 3,
              name: "Products",
              title: "Our Products",
              description: "Overview of our product offerings",
              copy_doc_link: "https://docs.google.com/document/d/mock-products-doc",
              status: "NEW",
              owner: {
                id: 3,
                name: "Product Manager",
                email: "pm@example.com",
                jobTitle: "Senior Product Manager",
                department: "Product",
                team: "Product Team",
                role: "Owner",
              },
              reviewers: [
                {
                  id: 4,
                  name: "Tech Reviewer",
                  email: "tech@example.com",
                  jobTitle: "Technical Writer",
                  department: "Engineering",
                  team: "Documentation Team",
                  role: "Reviewer",
                },
              ],
              products: [
                { id: 1, name: "Ubuntu" },
                { id: 2, name: "Canonical" },
                { id: 3, name: "MAAS" },
              ],
              children: [
                {
                  id: 4,
                  name: "Ubuntu",
                  title: "Ubuntu Operating System",
                  description: "The leading open source OS",
                  copy_doc_link: "https://docs.google.com/document/d/mock-ubuntu-doc",
                  status: "AVAILABLE",
                  owner: {
                    id: 1,
                    name: "Mock Owner",
                    email: "owner@example.com",
                    jobTitle: "Product Manager",
                    department: "Product",
                    team: "Web Team",
                    role: "Owner",
                  },
                  reviewers: [],
                  products: [{ id: 1, name: "Ubuntu" }],
                  children: [],
                  jira_tasks: [
                    {
                      id: 1,
                      jira_id: "MOCK-101",
                      name: "Update About Page",
                      status: "In Progress",
                      summary: "Update company information on about page",
                      created_at: "2024-01-15T10:30:00Z",
                    },
                  ],
                  url: "/products/ubuntu",
                  ext: ".html",
                  content_jira_id: "MOCK-102",
                },
              ],
              jira_tasks: [
                {
                  id: 2,
                  jira_id: "MOCK-102",
                  name: "Products Page Refresh",
                  status: "To Do",
                  summary: "Complete redesign of products overview page",
                  created_at: "2024-01-20T14:15:00Z",
                },
              ],
              url: "/products",
              ext: ".html",
              content_jira_id: "MOCK-102",
            },
          ],
          jira_tasks: [
            {
              id: 1,
              jira_id: "MOCK-101",
              name: "Update About Page",
              status: "In Progress",
              summary: "Update company information on about page",
              created_at: "2024-01-15T10:30:00Z",
            },
          ],
          url: "/",
          ext: ".html",
          project: {
            created_at: "2024-01-01T00:00:00Z",
            id: 1,
            name: "mock-project",
            updated_at: "2024-01-20T15:30:00Z",
          },
        },
      },
    };
  }

  private getDefaultUsersResponse() {
    return {
      data: [
        { id: 1, name: "Mock User 1", email: "user1@example.com" },
        { id: 2, name: "Mock User 2", email: "user2@example.com" },
      ],
    };
  }

  private getDefaultProductsResponse() {
    return {
      data: [
        { id: 1, name: "Mock Product 1" },
        { id: 2, name: "Mock Product 2" },
      ],
    };
  }

  private getDefaultCurrentUserResponse() {
    return {
      data: {
        id: 1,
        name: "Mock User",
        email: "mock@example.com",
        jobTitle: "Mock Job Title",
        department: "Mock Department",
        team: "Mock Team",
        role: "Mock Role",
      },
    };
  }

  private getSetOwnerResponse() {
    return {
      success: true,
      message: "Owner set successfully",
      data: {
        owner: {
          id: 1,
          name: "Mock Owner",
          email: "owner@example.com",
          jobTitle: "Content Owner",
          department: "Marketing",
          team: "Web Team",
          role: "Owner",
        },
      },
    };
  }

  private getSetReviewersResponse() {
    return {
      success: true,
      message: "Reviewers set successfully",
      data: {
        reviewers: [
          {
            id: 2,
            name: "Mock Reviewer 1",
            email: "reviewer1@example.com",
            jobTitle: "Content Reviewer",
            department: "Marketing",
            team: "Web Team",
            role: "Reviewer",
          },
          {
            id: 3,
            name: "Mock Reviewer 2",
            email: "reviewer2@example.com",
            jobTitle: "Technical Reviewer",
            department: "Engineering",
            team: "Frontend Team",
            role: "Reviewer",
          },
        ],
      },
    };
  }

  private getCreatePageResponse(params?: any) {
    const mockPage = {
      id: Math.floor(Math.random() * 1000) + 100,
      name: params?.name || "New Mock Page",
      title: params?.name || "New Mock Page",
      description: "A newly created mock page for testing purposes",
      copy_doc_link: params?.copy_doc_link || "https://docs.google.com/document/d/mock-doc-id",
      owner: params?.owner || {
        id: 1,
        name: "Mock Owner",
        email: "owner@example.com",
        jobTitle: "Content Owner",
        department: "Marketing",
        team: "Web Team",
        role: "Owner",
      },
      reviewers: params?.reviewers || [],
      status: "NEW",
      jira_tasks: [
        {
          id: 1,
          jira_id: "MOCK-101",
          name: "Update About Page",
          status: "In Progress",
          summary: "Update company information on about page",
          created_at: "2024-01-15T10:30:00Z",
        },
      ],
      children: [],
      products: [],
      parent_id: null,
      url: `/mock-project/${params?.name?.toLowerCase().replace(/\s+/g, "-") || "new-mock-page"}`,
      project: {
        created_at: new Date().toISOString(),
        id: 1,
        name: params?.project || "mock-project",
        updated_at: new Date().toISOString(),
      },
      ext: ".html",
      content_jira_id: `MOCK-${Math.floor(Math.random() * 1000)}`,
    };

    return {
      data: {
        webpage: mockPage,
      },
    };
  }

  private getRequestChangesResponse() {
    return {
      success: true,
      message: "Change request created successfully",
      data: {
        jira_task: {
          id: Math.floor(Math.random() * 1000) + 1,
          jira_id: `MOCK-${Math.floor(Math.random() * 1000)}`,
          name: "Mock Change Request",
          status: "To Do",
          summary: "Mock change request for testing",
          created_at: new Date().toISOString(),
        },
      },
    };
  }

  private getRequestRemovalResponse() {
    return {
      success: true,
      message: "Removal request created successfully",
      data: {
        jira_task: {
          id: Math.floor(Math.random() * 1000) + 1,
          jira_id: `MOCK-${Math.floor(Math.random() * 1000)}`,
          name: "Mock Removal Request",
          status: "To Do",
          summary: "Mock page removal request for testing",
          created_at: new Date().toISOString(),
        },
      },
    };
  }

  private getSetProductsResponse() {
    return {
      success: true,
      message: "Products assigned successfully",
      data: {
        products: [
          { id: 1, name: "Mock Product 1" },
          { id: 2, name: "Mock Product 2" },
        ],
      },
    };
  }

  private getCRUDProductResponse(method: string, params?: any) {
    const productId = Math.floor(Math.random() * 1000) + 1;
    const productName = params?.name || "Mock Product";

    switch (method.toLowerCase()) {
      case "post": // Create
        return {
          message: "Product created successfully",
          product: {
            id: productId,
            name: productName,
          },
        };
      case "put": // Update
        return {
          message: "Product updated successfully",
          product: {
            id: productId,
            name: productName,
          },
        };
      case "delete": // Delete
        return {
          message: "Product deleted successfully",
          product: {
            id: productId,
            name: productName,
          },
        };
      default:
        return {
          message: "Product operation completed",
          product: {
            id: productId,
            name: productName,
          },
        };
    }
  }

  private getWebpageAssetsResponse(params?: any) {
    const page = params?.page || 1;
    const perPage = params?.perPage || 20;
    const totalAssets = 47; // Mock total
    const totalPages = Math.ceil(totalAssets / perPage);

    // Generate mock assets for the current page
    const startIndex = (page - 1) * perPage;
    const endIndex = Math.min(startIndex + perPage, totalAssets);
    const assets = [];

    for (let i = startIndex; i < endIndex; i++) {
      assets.push({
        id: i + 1,
        url: `https://assets.ubuntu.com/v1/mock-asset-${i + 1}.jpg`,
        type: i % 3 === 0 ? "image" : i % 3 === 1 ? "video" : "document",
      });
    }

    return {
      data: {
        assets,
        page,
        page_size: perPage,
        total: totalAssets,
        total_pages: totalPages,
      },
    };
  }

  // Project-specific mock data generators
  private getUbuntuProjectTree() {
    return {
      data: {
        name: "ubuntu.com",
        templates: {
          id: 1,
          name: "/",
          title: "Ubuntu - The leading operating system for PCs, IoT devices, servers and the cloud",
          description: "Ubuntu homepage with product information and downloads",
          copy_doc_link: "https://docs.google.com/document/d/ubuntu-root-doc",
          status: "AVAILABLE",
          project: {
            id: 1,
            name: "ubuntu.com",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
          owner: {
            id: 1,
            name: "Ubuntu Team Lead",
            email: "ubuntu-lead@canonical.com",
            jobTitle: "Product Manager",
            department: "Product",
            team: "Ubuntu",
            role: "Owner",
          },
          reviewers: [
            {
              id: 2,
              name: "Ubuntu Content Reviewer",
              email: "ubuntu-content@canonical.com",
              jobTitle: "Content Manager",
              department: "Marketing",
              team: "Content",
              role: "Reviewer",
            },
          ],
          products: [
            { id: 1, name: "Ubuntu Desktop" },
            { id: 2, name: "Ubuntu Server" },
          ],
          children: [
            {
              id: 2,
              name: "/desktop",
              title: "Ubuntu Desktop",
              description: "Ubuntu for desktop and laptop computers",
              url: "/desktop",
              ext: ".html",
              status: "AVAILABLE",
              project: {
                id: 1,
                name: "ubuntu.com",
                created_at: "2024-01-01T00:00:00Z",
                updated_at: "2024-01-01T00:00:00Z",
              },
              owner: {
                id: 1,
                name: "Ubuntu Team Lead",
                email: "ubuntu-lead@canonical.com",
                jobTitle: "Product Manager",
                department: "Product",
                team: "Ubuntu",
                role: "Owner",
              },
              reviewers: [],
              products: [{ id: 1, name: "Ubuntu Desktop" }],
              children: [],
              jira_tasks: [
                {
                  id: 1,
                  jira_id: "MOCK-101",
                  name: "Update About Page",
                  status: "In Progress",
                  summary: "Update company information on about page",
                  created_at: "2024-01-15T10:30:00Z",
                },
              ],
            },
            {
              id: 3,
              name: "/server",
              title: "Ubuntu Server",
              description: "Ubuntu for servers and cloud deployments",
              url: "/server",
              ext: ".html",
              status: "AVAILABLE",
              project: {
                id: 1,
                name: "ubuntu.com",
                created_at: "2024-01-01T00:00:00Z",
                updated_at: "2024-01-01T00:00:00Z",
              },
              owner: {
                id: 3,
                name: "Server Team Lead",
                email: "server-lead@canonical.com",
                jobTitle: "Engineering Manager",
                department: "Engineering",
                team: "Server",
                role: "Owner",
              },
              reviewers: [],
              products: [{ id: 2, name: "Ubuntu Server" }],
              children: [],
              jira_tasks: [
                {
                  id: 1,
                  jira_id: "MOCK-101",
                  name: "Update About Page",
                  status: "In Progress",
                  summary: "Update company information on about page",
                  created_at: "2024-01-15T10:30:00Z",
                },
              ],
            },
          ],
          jira_tasks: [
            {
              id: 1,
              jira_id: "MOCK-101",
              name: "Update About Page",
              status: "In Progress",
              summary: "Update company information on about page",
              created_at: "2024-01-15T10:30:00Z",
            },
          ],
          url: "/",
          ext: ".html",
        },
      },
    };
  }

  private getCanonicalProjectTree() {
    return {
      data: {
        name: "canonical.com",
        templates: {
          id: 10,
          name: "/",
          title: "Canonical - The company behind Ubuntu",
          description: "Canonical company website with services and solutions",
          copy_doc_link: "https://docs.google.com/document/d/canonical-root-doc",
          status: "AVAILABLE",
          project: {
            id: 10,
            name: "canonical.com",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
          owner: {
            id: 10,
            name: "Canonical Marketing Lead",
            email: "marketing@canonical.com",
            jobTitle: "Marketing Director",
            department: "Marketing",
            team: "Corporate Marketing",
            role: "Owner",
          },
          reviewers: [],
          products: [{ id: 10, name: "Canonical Services" }],
          children: [
            {
              id: 11,
              name: "/about",
              title: "About Canonical",
              description: "Information about Canonical company",
              url: "/about",
              ext: ".html",
              status: "AVAILABLE",
              project: {
                id: 10,
                name: "canonical.com",
                created_at: "2024-01-01T00:00:00Z",
                updated_at: "2024-01-01T00:00:00Z",
              },
              owner: {
                id: 10,
                name: "Canonical Marketing Lead",
                email: "marketing@canonical.com",
                jobTitle: "Marketing Director",
                department: "Marketing",
                team: "Corporate Marketing",
                role: "Owner",
              },
              reviewers: [],
              products: [{ id: 10, name: "Canonical Services" }],
              children: [],
              jira_tasks: [
                {
                  id: 1,
                  jira_id: "MOCK-101",
                  name: "Update About Page",
                  status: "In Progress",
                  summary: "Update company information on about page",
                  created_at: "2024-01-15T10:30:00Z",
                },
              ],
            },
          ],
          jira_tasks: [
            {
              id: 1,
              jira_id: "MOCK-101",
              name: "Update About Page",
              status: "In Progress",
              summary: "Update company information on about page",
              created_at: "2024-01-15T10:30:00Z",
            },
          ],
          url: "/",
          ext: ".html",
        },
      },
    };
  }

  private getCnUbuntuProjectTree() {
    return {
      data: {
        name: "cn.ubuntu.com",
        templates: {
          id: 20,
          name: "/",
          title: "Ubuntu中国官网",
          description: "Ubuntu Chinese website",
          copy_doc_link: "https://docs.google.com/document/d/ubuntu-cn-root-doc",
          status: "AVAILABLE",
          project: {
            id: 20,
            name: "cn.ubuntu.com",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
          owner: {
            id: 20,
            name: "China Team Lead",
            email: "china-lead@canonical.com",
            jobTitle: "Regional Manager",
            department: "Regional",
            team: "China",
            role: "Owner",
          },
          reviewers: [],
          products: [
            { id: 1, name: "Ubuntu Desktop" },
            { id: 2, name: "Ubuntu Server" },
          ],
          children: [
            {
              id: 21,
              name: "/download",
              title: "下载Ubuntu",
              description: "Download Ubuntu in China",
              url: "/download",
              ext: ".html",
              status: "AVAILABLE",
              project: {
                id: 20,
                name: "cn.ubuntu.com",
                created_at: "2024-01-01T00:00:00Z",
                updated_at: "2024-01-01T00:00:00Z",
              },
              owner: {
                id: 20,
                name: "China Team Lead",
                email: "china-lead@canonical.com",
                jobTitle: "Regional Manager",
                department: "Regional",
                team: "China",
                role: "Owner",
              },
              reviewers: [],
              products: [{ id: 1, name: "Ubuntu Desktop" }],
              children: [],
              jira_tasks: [],
            },
          ],
          jira_tasks: [],
          url: "/",
          ext: ".html",
        },
      },
    };
  }

  private getJpUbuntuProjectTree() {
    return {
      data: {
        name: "jp.ubuntu.com",
        templates: {
          id: 30,
          name: "/",
          title: "Ubuntu日本公式サイト",
          description: "Ubuntu Japanese website",
          copy_doc_link: "https://docs.google.com/document/d/ubuntu-jp-root-doc",
          status: "AVAILABLE",
          project: {
            id: 30,
            name: "jp.ubuntu.com",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
          owner: {
            id: 30,
            name: "Japan Team Lead",
            email: "japan-lead@canonical.com",
            jobTitle: "Regional Manager",
            department: "Regional",
            team: "Japan",
            role: "Owner",
          },
          reviewers: [],
          products: [
            { id: 1, name: "Ubuntu Desktop" },
            { id: 2, name: "Ubuntu Server" },
          ],
          children: [
            {
              id: 31,
              name: "/desktop",
              title: "Ubuntu デスクトップ",
              description: "Ubuntu desktop for Japanese users",
              url: "/desktop",
              ext: ".html",
              status: "AVAILABLE",
              owner: {
                id: 30,
                name: "Japan Team Lead",
                email: "japan-lead@canonical.com",
                jobTitle: "Regional Manager",
                department: "Regional",
                team: "Japan",
                role: "Owner",
              },
              reviewers: [],
              products: [{ id: 1, name: "Ubuntu Desktop" }],
              children: [],
              jira_tasks: [],
            },
          ],
          jira_tasks: [],
          url: "/",
          ext: ".html",
        },
      },
    };
  }

  private getSnapcraftProjectTree() {
    return {
      data: {
        name: "snapcraft.io",
        templates: {
          id: 40,
          name: "/",
          title: "Snapcraft - Package any app for every Linux desktop, server, cloud or device",
          description: "Snapcraft website for snap package management",
          copy_doc_link: "https://docs.google.com/document/d/snapcraft-root-doc",
          status: "AVAILABLE",
          owner: {
            id: 40,
            name: "Snapcraft Team Lead",
            email: "snapcraft-lead@canonical.com",
            jobTitle: "Product Manager",
            department: "Product",
            team: "Snapcraft",
            role: "Owner",
          },
          reviewers: [],
          products: [{ id: 40, name: "Snapcraft" }],
          children: [
            {
              id: 41,
              name: "/store",
              title: "Snap Store",
              description: "Browse and discover snaps",
              url: "/store",
              ext: ".html",
              status: "AVAILABLE",
              owner: {
                id: 40,
                name: "Snapcraft Team Lead",
                email: "snapcraft-lead@canonical.com",
                jobTitle: "Product Manager",
                department: "Product",
                team: "Snapcraft",
                role: "Owner",
              },
              reviewers: [],
              products: [{ id: 40, name: "Snapcraft" }],
              children: [],
              jira_tasks: [],
            },
          ],
          jira_tasks: [],
          url: "/",
          ext: ".html",
        },
      },
    };
  }

  private getCharmhubProjectTree() {
    return {
      data: {
        name: "charmhub.io",
        templates: {
          id: 50,
          name: "/",
          title: "Charmhub - The Open Operator Collection",
          description: "Charmhub website for Juju charms",
          copy_doc_link: "https://docs.google.com/document/d/charmhub-root-doc",
          status: "AVAILABLE",
          owner: {
            id: 50,
            name: "Charmhub Team Lead",
            email: "charmhub-lead@canonical.com",
            jobTitle: "Product Manager",
            department: "Product",
            team: "Charmhub",
            role: "Owner",
          },
          reviewers: [],
          products: [{ id: 50, name: "Charmhub" }],
          children: [
            {
              id: 51,
              name: "/charms",
              title: "Browse Charms",
              description: "Discover available charms",
              url: "/charms",
              ext: ".html",
              status: "AVAILABLE",
              owner: {
                id: 50,
                name: "Charmhub Team Lead",
                email: "charmhub-lead@canonical.com",
                jobTitle: "Product Manager",
                department: "Product",
                team: "Charmhub",
                role: "Owner",
              },
              reviewers: [],
              products: [{ id: 50, name: "Charmhub" }],
              children: [],
              jira_tasks: [],
            },
          ],
          jira_tasks: [],
          url: "/",
          ext: ".html",
        },
      },
    };
  }

  private getCanonicalDesignProjectTree() {
    return {
      data: {
        name: "canonical.design",
        templates: {
          id: 60,
          name: "/",
          title: "Canonical Design System",
          description: "Design system and guidelines for Canonical products",
          copy_doc_link: "https://docs.google.com/document/d/design-root-doc",
          status: "AVAILABLE",
          owner: {
            id: 60,
            name: "Design Team Lead",
            email: "design-lead@canonical.com",
            jobTitle: "Design Director",
            department: "Design",
            team: "Design System",
            role: "Owner",
          },
          reviewers: [],
          products: [{ id: 60, name: "Design System" }],
          children: [
            {
              id: 61,
              name: "/components",
              title: "Components",
              description: "Design system components",
              url: "/components",
              ext: ".html",
              status: "AVAILABLE",
              owner: {
                id: 60,
                name: "Design Team Lead",
                email: "design-lead@canonical.com",
                jobTitle: "Design Director",
                department: "Design",
                team: "Design System",
                role: "Owner",
              },
              reviewers: [],
              products: [{ id: 60, name: "Design System" }],
              children: [],
              jira_tasks: [],
            },
          ],
          jira_tasks: [],
          url: "/",
          ext: ".html",
        },
      },
    };
  }

  private getNetplanProjectTree() {
    return {
      data: {
        name: "netplan.io",
        templates: {
          id: 70,
          name: "/",
          title: "Netplan - Network configuration abstraction renderer",
          description: "Netplan documentation and information",
          copy_doc_link: "https://docs.google.com/document/d/netplan-root-doc",
          status: "AVAILABLE",
          owner: {
            id: 70,
            name: "Netplan Team Lead",
            email: "netplan-lead@canonical.com",
            jobTitle: "Engineering Manager",
            department: "Engineering",
            team: "Netplan",
            role: "Owner",
          },
          reviewers: [],
          products: [{ id: 70, name: "Netplan" }],
          children: [
            {
              id: 71,
              name: "/documentation",
              title: "Documentation",
              description: "Netplan configuration documentation",
              url: "/documentation",
              ext: ".html",
              status: "AVAILABLE",
              owner: {
                id: 70,
                name: "Netplan Team Lead",
                email: "netplan-lead@canonical.com",
                jobTitle: "Engineering Manager",
                department: "Engineering",
                team: "Netplan",
                role: "Owner",
              },
              reviewers: [],
              products: [{ id: 70, name: "Netplan" }],
              children: [],
              jira_tasks: [],
            },
          ],
          jira_tasks: [],
          url: "/",
          ext: ".html",
        },
      },
    };
  }
}

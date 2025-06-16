# API Documentation

## Models API
**Base URL**: `/models`
- **GET** `/`
  - Controller: `ModelController`
  - Files:
    - `api/server/routes/models.js`
    - `api/server/controllers/ModelController.js`
  - Middleware: `requireJwtAuth`
  - Description: ดึงข้อมูล model configuration

## Assistants API
**Base URL**: `/assistants`

### V1
- **GET|POST** `/actions`
  - Files:
    - `api/server/routes/assistants/v1.js`
    - `api/server/controllers/assistants/v1.js`

### V2
- **GET|POST** `/actions`
  - Files:
    - `api/server/routes/assistants/v2.js`
    - `api/server/controllers/assistants/v2.js`

### Documents
- **GET** `/documents`
  - Files:
    - `api/server/routes/assistants/documents.js`
    - `api/server/controllers/assistants/v1.js`
  - Description: ดึงรายการ documents ของ assistant

### Chat
- **POST** `/`
  - Files:
    - `api/server/routes/assistants/chatV1.js`
  - Middleware: 
    - `validateModel`
    - `buildEndpointOption`
    - `validateAssistant`
    - `validateConvoAccess`
    - `setHeaders`
  - Description: สนทนากับ assistant

## Admin API
**Base URL**: `/admin`

- **POST** `/impersonate`
  - Files:
    - `api/custom/routes/admin.js`
    - `api/custom/controllers/admin.js`
  - Middleware: `requireJwtAuth`
  - Description: จำลองการทำงานเป็นผู้ใช้คนอื่น

## User API
**Base URL**: `/user`

- **GET** `/usage-permission`
  - Files:
    - `api/custom/routes/user.js`
    - `api/server/controllers/UserController.js`
  - Middleware: `requireJwtAuth`
  - Description: ตรวจสอบสิทธิ์การใช้งาน

- **GET** `/admin/users-registered-today`
  - Files:
    - `api/custom/routes/user.js`
    - `api/custom/controllers/admin.js`
  - Middleware: `requireJwtAuth`
  - Description: ดึงข้อมูลผู้ใช้ที่ลงทะเบียนวันนี้

- **PUT** `/admin/users/make-admin`
  - Files:
    - `api/custom/routes/user.js`
    - `api/custom/controllers/admin.js`
  - Middleware: `requireJwtAuth`, `checkAdmin`
  - Description: กำหนดให้ผู้ใช้เป็น admin

- **PUT** `/admin/users/make-user`
  - Files:
    - `api/custom/routes/user.js`
    - `api/custom/controllers/admin.js`
  - Middleware: `requireJwtAuth`, `checkAdmin`
  - Description: กำหนดให้ผู้ใช้เป็น user ปกติ

- **PUT** `/admin/users/super-credit`
  - Files:
    - `api/custom/routes/user.js`
    - `api/custom/controllers/admin.js`
  - Middleware: `requireJwtAuth`, `checkAdmin`
  - Description: อัปเดต super credit ของผู้ใช้

## Edit API
**Base URL**: `/edit`

### Google
- **POST** `/[provider]`
  - Files:
    - `api/server/routes/edit/google.js`
    - `api/server/controllers/EditController.js`
  - Middleware:
    - `validateEndpoint`
    - `validateModel`
    - `buildEndpointOption`
    - `setHeaders`
  - Description: แก้ไขข้อมูลผ่าน Google provider

### Anthropic
- **POST** `/[provider]`
  - Files:
    - `api/server/routes/edit/anthropic.js`
    - `api/server/controllers/EditController.js`
  - Middleware:
    - `validateEndpoint`
    - `validateModel`
    - `buildEndpointOption`
    - `setHeaders`
  - Description: แก้ไขข้อมูลผ่าน Anthropic provider

### OpenAI
- **POST** `/[provider]`
  - Files:
    - `api/server/routes/edit/openAI.js`
    - `api/server/controllers/EditController.js`
  - Middleware:
    - `validateEndpoint`
    - `validateModel`
    - `buildEndpointOption`
    - `setHeaders`
    - `moderateText`
  - Description: แก้ไขข้อมูลผ่าน OpenAI provider

### Custom
- **POST** `/[provider]`
  - Files:
    - `api/server/routes/edit/custom.js`
    - `api/server/controllers/EditController.js`
  - Middleware:
    - `validateEndpoint`
    - `validateModel`
    - `buildEndpointOption`
    - `setHeaders`
  - Description: แก้ไขข้อมูลผ่าน Custom provider

## Authentication API
**Base URL**: `/auth`

### Register
- **POST** `/register`
  - Files:
    - `api/server/routes/auth.js`
    - `api/server/controllers/AuthController.js`
    - `api/server/services/AuthService.js`
  - Middleware:
    - `registerLimiter`
    - `checkBan`
    - `checkInviteUser`
  - Description: สมัครผู้ใช้ใหม่
  - Request Body:
    ```typescript
    {
      name: string;        // ชื่อ-นามสกุล (3-80 ตัวอักษร)
      email: string;       // อีเมล
      username: string;    // ชื่อผู้ใช้ (ไม่บังคับ)
      password: string;    // รหัสผ่าน (8-128 ตัวอักษร)
      confirm_password: string; // ยืนยันรหัสผ่าน
      school: number;      // รหัสโรงเรียน
    }
    ```

### School Admin Create User
- **POST** `/user/school-admin/create-user`
  - Files:
    - `api/custom/routes/user.js`
    - `api/custom/controllers/schooladmin.js`
  - Middleware: `requireJwtAuth`
  - Description: สร้างผู้ใช้ใหม่โดย School Admin
  - Request Body:
    ```typescript
    {
      email: string;       // อีเมล
      name: string;        // ชื่อ-นามสกุล
      username: string;    // ชื่อผู้ใช้ (ไม่บังคับ)
      password: string;    // รหัสผ่าน
    }
    ```
  - เงื่อนไข:
    - ต้องเป็น School Admin เท่านั้น
    - ต้องตรวจสอบสิทธิ์ premium ของโรงเรียน
    - ถ้าผู้ใช้มีอยู่แล้ว จะอัปเดตข้อมูลโรงเรียนให้
    - ถ้าผู้ใช้ไม่มี จะสร้างผู้ใช้ใหม่

### Social Login Registration
- ต้องเปิดใช้งาน `ALLOW_SOCIAL_REGISTRATION` ใน .env
- รองรับ providers:
  - Google
  - Facebook
  - OpenID
  - SAML
  - LDAP
  - GitHub
  - Discord
  - Apple 

## API Endpoints
**Base URLs**:

### AI Endpoints
- **GET** `/api/endpoints`
  - Files:
    - `api/server/routes/endpoints.js`
    - `api/server/controllers/EndpointController.js`
  - Description: ดึงข้อมูล endpoints ทั้งหมด
  - Response: `TEndpointsConfig`

### Keys Management
- **GET|POST** `/api/keys`
  - Description: จัดการ API keys

### Roles Management
- **GET** `/api/roles`
  - Description: ดึงข้อมูล roles ทั้งหมด

### Agents & Tools
- **GET** `/agents/tools`
  - Files:
    - `api/server/routes/agents/tools.js`
    - `api/server/controllers/PluginController.js`
  - Description: ดึงรายการ tools ที่ใช้ได้สำหรับ agents

- **GET|POST** `/api/agents`
  - Description: จัดการ agents
  - Query Parameters:
    ```typescript
    {
      path?: string;      // เส้นทางย่อย
      options?: object;   // ตัวเลือกเพิ่มเติม
    }
    ```

## Known Endpoints
ระบบรองรับ endpoints ต่อไปนี้:
- anyscale
- apipie
- cohere
- fireworks
- deepseek
- groq
- huggingface
- mistral
- mlx
- ollama
- openrouter
- perplexity
- shuttleai
- together.ai
- unify
- xai

## Endpoint URLs
```typescript
{
  [EModelEndpoint.openAI]: '/api/ask/openAI',
  [EModelEndpoint.google]: '/api/ask/google',
  [EModelEndpoint.custom]: '/api/ask/custom',
  [EModelEndpoint.anthropic]: '/api/ask/anthropic',
  [EModelEndpoint.gptPlugins]: '/api/ask/gptPlugins',
  [EModelEndpoint.azureOpenAI]: '/api/ask/azureOpenAI',
  [EModelEndpoint.chatGPTBrowser]: '/api/ask/chatGPTBrowser',
  [EModelEndpoint.azureAssistants]: '/api/assistants/v1/chat',
  [EModelEndpoint.assistants]: '/api/assistants/v2/chat',
  [EModelEndpoint.agents]: '/api/agents/chat',
  [EModelEndpoint.bedrock]: '/api/bedrock/chat'
}
```

## File Configuration
```typescript
interface EndpointFileConfig {
  disabled?: boolean;           // ปิดการใช้งานการอัปโหลดไฟล์
  fileLimit?: number;          // จำนวนไฟล์สูงสุด
  fileSizeLimit?: number;      // ขนาดไฟล์สูงสุด
  totalSizeLimit?: number;     // ขนาดรวมสูงสุด
  supportedMimeTypes?: RegExp[]; // ประเภทไฟล์ที่รองรับ
}

interface FileConfig {
  endpoints: {
    [key: string]: EndpointFileConfig;
  };
  serverFileSizeLimit?: number;  // ขนาดไฟล์สูงสุดที่ server
  avatarSizeLimit?: number;      // ขนาดไฟล์รูปโปรไฟล์สูงสุด
  checkType?: (fileType: string, supportedTypes: RegExp[]) => boolean;
}
```

## Request Types
```typescript
interface RequestData {
  user: {
    id: string;
  };
  body: {
    model?: string;
    endpoint?: string;
    key?: string;
  };
  app: {
    locals: {
      [EModelEndpoint.azureOpenAI]?: TAzureConfig;
      [EModelEndpoint.openAI]?: TEndpoint;
      all?: TEndpoint;
    };
  };
}
```

## Middleware ที่ใช้บ่อย
- `requireJwtAuth`: ตรวจสอบการยืนยันตัวตน
- `checkAdmin`: ตรวจสอบสิทธิ์ผู้ดูแลระบบ
- `validateModel`: ตรวจสอบความถูกต้องของ model
- `validateEndpoint`: ตรวจสอบความถูกต้องของ endpoint
- `buildEndpointOption`: สร้างตัวเลือก endpoint
- `setHeaders`: ตั้งค่า headers
- `moderateText`: ตรวจสอบเนื้อหา
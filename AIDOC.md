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

## Agents Tools API
**Base URL**: `/agents/tools`

- **GET** `/`
  - Files:
    - `api/server/routes/agents/tools.js`
    - `api/server/controllers/PluginController.js`
  - Description: ดึงรายการ tools ที่ใช้ได้สำหรับ agents

## Endpoints API
**Base URL**: `/endpoints`

- **GET** `/`
  - Files:
    - `api/server/routes/endpoints.js`
    - `api/server/controllers/EndpointController.js`
  - Description: ดึงข้อมูล endpoints

## Middleware ที่ใช้บ่อย
- `requireJwtAuth`: ตรวจสอบการยืนยันตัวตน
- `checkAdmin`: ตรวจสอบสิทธิ์ผู้ดูแลระบบ
- `validateModel`: ตรวจสอบความถูกต้องของ model
- `validateEndpoint`: ตรวจสอบความถูกต้องของ endpoint
- `buildEndpointOption`: สร้างตัวเลือก endpoint
- `setHeaders`: ตั้งค่า headers
- `moderateText`: ตรวจสอบเนื้อหา 
# API Documentation

## Models API
**Base URL**: `/models`
- **GET** `/`
  - Description: ดึงข้อมูล model configuration
  - Controller: `ModelController`
  - Files:
    - `api/server/routes/models.js`
    - `api/server/controllers/ModelController.js`
  - Middleware: `requireJwtAuth`
  - Response: `TModelsConfig`

## Assistants API
**Base URL**: `/assistants`

### V1
- **GET|POST** `/actions`
  - Description: จัดการ actions ของ assistant
  - Files:
    - `api/server/routes/assistants/v1.js`
    - `api/server/controllers/assistants/v1.js`
  - Middleware: `requireJwtAuth`

### V2
- **GET|POST** `/actions`
  - Description: จัดการ actions ของ assistant (เวอร์ชัน 2)
  - Files:
    - `api/server/routes/assistants/v2.js`
    - `api/server/controllers/assistants/v2.js`
  - Middleware: `requireJwtAuth`

### Documents
- **GET** `/documents`
  - Description: ดึงรายการ documents ของ assistant
  - Files:
    - `api/server/routes/assistants/documents.js`
    - `api/server/controllers/assistants/v1.js`
  - Middleware: `requireJwtAuth`
  - Response: `Document[]`

### Chat
- **POST** `/`
  - Description: สนทนากับ assistant
  - Files:
    - `api/server/routes/assistants/chatV1.js`
  - Middleware: 
    - `validateModel`
    - `buildEndpointOption`
    - `validateAssistant`
    - `validateConvoAccess`
    - `setHeaders`
  - Request Body:
    ```typescript
    {
      message: string;
      conversationId?: string;
      parentMessageId?: string;
    }
    ```
  - Response: `ChatResponse`

## Admin API
**Base URL**: `/admin`

- **POST** `/impersonate`
  - Description: จำลองการทำงานเป็นผู้ใช้คนอื่น
  - Files:
    - `api/custom/routes/admin.js`
    - `api/custom/controllers/admin.js`
  - Middleware: `requireJwtAuth`
  - Request Body:
    ```typescript
    {
      userId: string;
    }
    ```

## User API
**Base URL**: `/user`

- **GET** `/`
  - Description: ดึงข้อมูลผู้ใช้
  - Files:
    - `api/server/routes/user.js`
    - `api/server/controllers/UserController.js`
  - Middleware: `requireJwtAuth`
  - Response: `User`

- **GET** `/terms`
  - Description: ตรวจสอบสถานะการยอมรับเงื่อนไข
  - Files:
    - `api/server/routes/user.js`
    - `api/server/controllers/UserController.js`
  - Middleware: `requireJwtAuth`
  - Response: `{ accepted: boolean }`

- **POST** `/terms/accept`
  - Description: ยอมรับเงื่อนไขการใช้งาน
  - Files:
    - `api/server/routes/user.js`
    - `api/server/controllers/UserController.js`
  - Middleware: `requireJwtAuth`

- **POST** `/plugins`
  - Description: อัปเดต plugins ของผู้ใช้
  - Files:
    - `api/server/routes/user.js`
    - `api/server/controllers/UserController.js`
  - Middleware: `requireJwtAuth`
  - Request Body:
    ```typescript
    {
      plugins: string[];
    }
    ```

- **DELETE** `/delete`
  - Description: ลบบัญชีผู้ใช้
  - Files:
    - `api/server/routes/user.js`
    - `api/server/controllers/UserController.js`
  - Middleware: `requireJwtAuth`, `canDeleteAccount`

- **POST** `/verify`
  - Description: ยืนยันอีเมล
  - Files:
    - `api/server/routes/user.js`
    - `api/server/controllers/UserController.js`
  - Middleware: `verifyEmailLimiter`
  - Request Body:
    ```typescript
    {
      email: string;
      code: string;
    }
    ```

- **POST** `/verify/resend`
  - Description: ส่งอีเมลยืนยันใหม่
  - Files:
    - `api/server/routes/user.js`
    - `api/server/controllers/UserController.js`
  - Middleware: `verifyEmailLimiter`
  - Request Body:
    ```typescript
    {
      email: string;
    }
    ```

- **GET** `/usage-permission`
  - Description: ตรวจสอบสิทธิ์การใช้งาน
  - Files:
    - `api/custom/routes/user.js`
    - `api/server/controllers/UserController.js`
  - Middleware: `requireJwtAuth`
  - Response: `{ hasPermission: boolean }`

## Edit API
**Base URL**: `/edit`

### Google
- **POST** `/[provider]`
  - Description: แก้ไขข้อมูลผ่าน Google provider
  - Files:
    - `api/server/routes/edit/google.js`
    - `api/server/controllers/EditController.js`
  - Middleware:
    - `validateEndpoint`
    - `validateModel`
    - `buildEndpointOption`
    - `setHeaders`
  - Request Body:
    ```typescript
    {
      text: string;
      model: string;
    }
    ```

### Anthropic
- **POST** `/[provider]`
  - Description: แก้ไขข้อมูลผ่าน Anthropic provider
  - Files:
    - `api/server/routes/edit/anthropic.js`
    - `api/server/controllers/EditController.js`
  - Middleware:
    - `validateEndpoint`
    - `validateModel`
    - `buildEndpointOption`
    - `setHeaders`
  - Request Body:
    ```typescript
    {
      text: string;
      model: string;
    }
    ```

### OpenAI
- **POST** `/[provider]`
  - Description: แก้ไขข้อมูลผ่าน OpenAI provider
  - Files:
    - `api/server/routes/edit/openAI.js`
    - `api/server/controllers/EditController.js`
  - Middleware:
    - `validateEndpoint`
    - `validateModel`
    - `buildEndpointOption`
    - `setHeaders`
    - `moderateText`
  - Request Body:
    ```typescript
    {
      text: string;
      model: string;
    }
    ```

### Custom
- **POST** `/[provider]`
  - Description: แก้ไขข้อมูลผ่าน Custom provider
  - Files:
    - `api/server/routes/edit/custom.js`
    - `api/server/controllers/EditController.js`
  - Middleware:
    - `validateEndpoint`
    - `validateModel`
    - `buildEndpointOption`
    - `setHeaders`
  - Request Body:
    ```typescript
    {
      text: string;
      model: string;
    }
    ```

## Authentication API
**Base URL**: `/auth`

### Register
- **POST** `/register`
  - Description: สมัครผู้ใช้ใหม่
  - Files:
    - `api/server/routes/auth.js`
    - `api/server/controllers/AuthController.js`
    - `api/server/services/AuthService.js`
  - Middleware:
    - `registerLimiter`
    - `checkBan`
    - `checkInviteUser`
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
  - Description: สร้างผู้ใช้ใหม่โดย School Admin
  - Files:
    - `api/custom/routes/user.js`
    - `api/custom/controllers/schooladmin.js`
  - Middleware: `requireJwtAuth`
  - Request Body:
    ```typescript
    {
      email: string;       // อีเมล
      name: string;        // ชื่อ-นามสกุล
      username: string;    // ชื่อผู้ใช้ (ไม่บังคับ)
      password: string;    // รหัสผ่าน
    }
    ```

## Endpoints API
**Base URL**: `/endpoints`

- **GET** `/`
  - Description: ดึงข้อมูล endpoints ทั้งหมด
  - Files:
    - `api/server/routes/endpoints.js`
    - `api/server/controllers/EndpointController.js`
  - Response: `Endpoint[]`

- **GET** `/config/override`
  - Description: ดึงข้อมูลการ override endpoints
  - Files:
    - `api/server/routes/endpoints.js`
    - `api/server/controllers/OverrideController.js`
  - Response: `OverrideConfig`

## Agents Tools API
**Base URL**: `/api/agents/tools`

- **GET** `/`
  - Description: ดึงข้อมูล tools ทั้งหมด
  - Files:
    - `api/server/routes/agents/tools.js`
    - `api/server/controllers/PluginController.js`
  - Response: `Tool[]`

- **GET** `/stream`
  - Description: ดึงข้อมูล tools แบบ stream
  - Files:
    - `api/server/routes/agents/tools.js`
    - `api/server/controllers/PluginController.js`
  - Response: `Tool[]`

## Custom Balance API
**Base URL**: `/api/custom-balance`

- **POST** `/clear-school-cache`
  - Description: ล้าง cache ของ school bill token
  - Files:
    - `api/custom/routes/balance.js`
    - `api/custom/controllers/balance.js`
  - Response: 
    ```typescript
    {
      success: boolean;
    }
    ```

## School API
**Base URL**: `/api/school`

- **GET** `/premium/all`
  - Description: ดึงข้อมูล Premium ของโรงเรียนทั้งหมด
  - Files:
    - `api/custom/routes/school.js`
    - `api/custom/controllers/school.js`
  - Response: `SchoolPremium[]`

## User Admin API
**Base URL**: `/api/user/admin`

- **GET** `/count-by-school`
  - Description: ดึงข้อมูลจำนวนผู้ใช้ตามโรงเรียน
  - Files:
    - `api/custom/routes/user.js`
    - `api/custom/controllers/admin.js`
  - Response:
    ```typescript
    {
      userCountBySchool: Record<number, number>;
      schoolMonthlyCredits: Record<number, number>;
      totalUsers: number;
      totalSchools: number;
    }
    ```

## Prompts API
**Base URL**: `/api/prompts`

- **GET** `/recent`
  - Description: ดึงข้อมูล prompts ล่าสุด
  - Files:
    - `api/server/routes/prompts.js`
    - `api/server/controllers/PromptController.js`
  - Response: `string[]`

## Custom Presets API
**Base URL**: `/api/custom-presets`

- **GET** `/max-context`
  - Description: ดึงข้อมูล max context tokens
  - Files:
    - `api/server/routes/presets.js`
    - `api/server/controllers/PresetController.js`
  - Response:
    ```typescript
    {
      maxContextTokens: number;
    }
    ```

## Balance API
**Base URL**: `/balance`

- **GET** `/`
  - Description: ดึงข้อมูลยอดเงินคงเหลือ
  - Files:
    - `api/server/routes/balance.js`
    - `api/server/controllers/BalanceController.js`
  - Middleware: `requireJwtAuth`
  - Response: `Balance`

## Coupon API
**Base URL**: `/api/coupon`

- **GET** `/`
  - Description: ดึงข้อมูลคูปองทั้งหมด
  - Files:
    - `api/custom/routes/coupon.js`
    - `api/custom/controllers/coupon.js`
  - Middleware: `requireJwtAuth`, `checkAdmin`
  - Response: `Coupon[]`

- **GET** `/logs/me`
  - Description: ดึงประวัติการใช้คูปองของตัวเอง
  - Files:
    - `api/custom/routes/coupon.js`
    - `api/custom/controllers/coupon.js`
  - Middleware: `requireJwtAuth`
  - Response: `CouponLog[]`

- **GET** `/:couponcode`
  - Description: ดึงข้อมูลคูปองตามรหัสคูปอง
  - Files:
    - `api/custom/routes/coupon.js`
    - `api/custom/controllers/coupon.js`
  - Middleware: `requireJwtAuth`, `checkAdmin`
  - Response: `Coupon`

- **POST** `/`
  - Description: สร้างคูปองใหม่
  - Files:
    - `api/custom/routes/coupon.js`
    - `api/custom/controllers/coupon.js`
  - Middleware: `requireJwtAuth`, `checkAdmin`
  - Request Body:
    ```typescript
    {
      couponCode: string;
      credit: number;
      expiredDate: string;
    }
    ```

- **PUT** `/:couponcode`
  - Description: อัปเดตข้อมูลคูปอง
  - Files:
    - `api/custom/routes/coupon.js`
    - `api/custom/controllers/coupon.js`
  - Middleware: `requireJwtAuth`, `checkAdmin`
  - Request Body: `Coupon`

- **DELETE** `/:couponcode`
  - Description: ลบคูปอง
  - Files:
    - `api/custom/routes/coupon.js`
    - `api/custom/controllers/coupon.js`
  - Middleware: `requireJwtAuth`, `checkAdmin`

- **POST** `/redeem`
  - Description: ใช้คูปองเพื่อรับเครดิต
  - Files:
    - `api/custom/routes/coupon.js`
    - `api/custom/controllers/coupon.js`
  - Middleware: `requireJwtAuth`
  - Request Body:
    ```typescript
    {
      couponCode: string;
    }
    ```

## School API
**Base URL**: `/api/school`

- **POST** `/premium/update`
  - Description: สร้างหรืออัปเดตข้อมูล premium ของโรงเรียน
  - Files:
    - `api/custom/routes/school.js`
    - `api/custom/controllers/school.js`
  - Middleware: `requireJwtAuth`, `checkAdmin`
  - Request Body: `SchoolPremium`

- **GET** `/premium/:school`
  - Description: ดึงข้อมูล premium ของโรงเรียน
  - Files:
    - `api/custom/routes/school.js`
    - `api/custom/controllers/school.js`
  - Middleware: `requireJwtAuth`
  - Response: `SchoolPremium`

- **GET** `/period/:schoolId`
  - Description: คำนวณรอบบิลของโรงเรียน
  - Files:
    - `api/custom/routes/school.js`
    - `api/custom/controllers/school.js`
  - Response: `{ start: Date; end: Date }`

- **GET** `/balance`
  - Description: ตรวจสอบยอดเงินคงเหลือของโรงเรียน
  - Files:
    - `api/custom/routes/school.js`
    - `api/custom/controllers/school.js`
  - Middleware: `requireJwtAuth`
  - Response:
    ```typescript
    {
      schoolId: number;
      totalTokenValue: number;
      remainingBalance: number;
      periodStart: Date;
      periodEnd: Date;
      transactionCount: number;
      tokenSummary: object;
    }
    ```

## Prompts API
**Base URL**: `/api/prompts`

- **POST** `/history`
  - Description: บันทึกประวัติการใช้งาน prompt
  - Files:
    - `api/server/routes/prompts.js`
    - `api/server/controllers/PromptController.js`
  - Middleware: `requireJwtAuth`
  - Request Body:
    ```typescript
    {
      prompt: string;
    }
    ```

## Memories API
**Base URL**: `/memories`

- **GET** `/`
  - Description: ดึงข้อมูล memories ทั้งหมดของผู้ใช้
  - Files:
    - `api/server/routes/memories.js`
    - `api/server/controllers/MemoryController.js`
  - Middleware: `requireJwtAuth`, `checkMemoryRead`
  - Response:
    ```typescript
    {
      memories: Memory[];
      totalTokens: number;
      tokenLimit: number | null;
      usagePercentage: number | null;
    }
    ```

- **POST** `/`
  - Description: สร้าง memory ใหม่
  - Files:
    - `api/server/routes/memories.js`
    - `api/server/controllers/MemoryController.js`
  - Middleware: `requireJwtAuth`, `checkMemoryCreate`
  - Request Body:
    ```typescript
    {
      key: string;    // คีย์ของ memory
      value: string;  // ค่าของ memory
    }
    ```

- **PATCH** `/preferences`
  - Description: อัปเดตการตั้งค่า memories ของผู้ใช้
  - Files:
    - `api/server/routes/memories.js`
    - `api/server/controllers/MemoryController.js`
  - Middleware: `requireJwtAuth`, `checkMemoryOptOut`
  - Request Body:
    ```typescript
    {
      memories: boolean;  // เปิด/ปิดการใช้งาน memories
    }
    ```

- **PATCH** `/:key`
  - Description: อัปเดตค่า memory ที่มีอยู่
  - Files:
    - `api/server/routes/memories.js`
    - `api/server/controllers/MemoryController.js`
  - Middleware: `requireJwtAuth`, `checkMemoryUpdate`
  - Request Body:
    ```typescript
    {
      value: string;  // ค่าใหม่ของ memory
    }
    ```

- **DELETE** `/:key`
  - Description: ลบ memory
  - Files:
    - `api/server/routes/memories.js`
    - `api/server/controllers/MemoryController.js`
  - Middleware: `requireJwtAuth`, `checkMemoryDelete`

## Messages API
**Base URL**: `/messages`

- **GET** `/`
  - Description: ดึงข้อมูลข้อความทั้งหมด
  - Files:
    - `api/server/routes/messages.js`
    - `api/server/controllers/MessageController.js`
  - Middleware: `requireJwtAuth`
  - Query Parameters:
    ```typescript
    {
      cursor?: string;           // cursor สำหรับ pagination
      sortBy?: string;           // ฟิลด์ที่ใช้เรียงลำดับ
      sortDirection?: 'asc' | 'desc';  // ทิศทางการเรียงลำดับ
      pageSize?: number;         // จำนวนรายการต่อหน้า
      conversationId?: string;   // ID ของการสนทนา
      messageId?: string;        // ID ของข้อความ
      search?: string;           // ค้นหาข้อความ
    }
    ```

- **POST** `/artifact/:messageId`
  - Description: อัปเดต artifact ในข้อความ
  - Files:
    - `api/server/routes/messages.js`
    - `api/server/controllers/MessageController.js`
  - Middleware: `requireJwtAuth`
  - Request Body:
    ```typescript
    {
      index: number;     // index ของ artifact
      original: string;  // เนื้อหาเดิม
      updated: string;   // เนื้อหาใหม่
    }
    ```

- **GET** `/:conversationId`
  - Description: ดึงข้อความทั้งหมดในบทสนทนา
  - Files:
    - `api/server/routes/messages.js`
    - `api/server/controllers/MessageController.js`
  - Middleware: `requireJwtAuth`, `validateMessageReq`
  - Response: `Message[]`

- **POST** `/:conversationId`
  - Description: สร้างข้อความใหม่ในบทสนทนา
  - Files:
    - `api/server/routes/messages.js`
    - `api/server/controllers/MessageController.js`
  - Middleware: `requireJwtAuth`, `validateMessageReq`
  - Request Body: `Message`

- **GET** `/:conversationId/:messageId`
  - Description: ดึงข้อความเฉพาะในบทสนทนา
  - Files:
    - `api/server/routes/messages.js`
    - `api/server/controllers/MessageController.js`
  - Middleware: `requireJwtAuth`, `validateMessageReq`
  - Response: `Message`

- **PUT** `/:conversationId/:messageId`
  - Description: อัปเดตข้อความ
  - Files:
    - `api/server/routes/messages.js`
    - `api/server/controllers/MessageController.js`
  - Middleware: `requireJwtAuth`, `validateMessageReq`
  - Request Body:
    ```typescript
    {
      text: string;      // เนื้อหาใหม่
      index?: number;    // index ของเนื้อหาที่จะอัปเดต
      model?: string;    // model ที่ใช้
    }
    ```

## Roles API
**Base URL**: `/roles`

- **GET** `/:roleName`
  - Description: ดึงข้อมูลบทบาทตามชื่อ
  - Files:
    - `api/server/routes/roles.js`
    - `api/server/controllers/RoleController.js`
  - Middleware: `requireJwtAuth`
  - Response: `Role`

- **PUT** `/:roleName/prompts`
  - Description: อัปเดตสิทธิ์เกี่ยวกับ prompts ของบทบาท
  - Files:
    - `api/server/routes/roles.js`
    - `api/server/controllers/RoleController.js`
  - Middleware: `requireJwtAuth`, `checkAdmin`
  - Request Body: `PromptPermissions`

- **PUT** `/:roleName/agents`
  - Description: อัปเดตสิทธิ์เกี่ยวกับ agents ของบทบาท
  - Files:
    - `api/server/routes/roles.js`
    - `api/server/controllers/RoleController.js`
  - Middleware: `requireJwtAuth`, `checkAdmin`
  - Request Body: `AgentPermissions`

- **PUT** `/:roleName/memories`
  - Description: อัปเดตสิทธิ์เกี่ยวกับ memories ของบทบาท
  - Files:
    - `api/server/routes/roles.js`
    - `api/server/controllers/RoleController.js`
  - Middleware: `requireJwtAuth`, `checkAdmin`
  - Request Body: `MemoryPermissions`

## Share API
**Base URL**: `/share`

- **GET** `/`
  - Description: ดึงรายการ shared links ทั้งหมด
  - Files:
    - `api/server/routes/share.js`
    - `api/server/controllers/ShareController.js`
  - Middleware: `requireJwtAuth`
  - Query Parameters:
    ```typescript
    {
      cursor?: string;           // cursor สำหรับ pagination
      pageSize?: number;         // จำนวนรายการต่อหน้า
      isPublic?: boolean;        // แสดงเฉพาะ public links
      sortBy?: 'createdAt' | 'title';  // ฟิลด์ที่ใช้เรียงลำดับ
      sortDirection?: 'asc' | 'desc';  // ทิศทางการเรียงลำดับ
      search?: string;           // ค้นหา links
    }
    ```

- **GET** `/link/:conversationId`
  - Description: ดึงข้อมูล shared link ของบทสนทนา
  - Files:
    - `api/server/routes/share.js`
    - `api/server/controllers/ShareController.js`
  - Middleware: `requireJwtAuth`
  - Response:
    ```typescript
    {
      success: boolean;
      shareId: string;
      conversationId: string;
    }
    ```

- **POST** `/:conversationId`
  - Description: สร้าง shared link สำหรับบทสนทนา
  - Files:
    - `api/server/routes/share.js`
    - `api/server/controllers/ShareController.js`
  - Middleware: `requireJwtAuth`

- **PATCH** `/:shareId`
  - Description: อัปเดต shared link
  - Files:
    - `api/server/routes/share.js`
    - `api/server/controllers/ShareController.js`
  - Middleware: `requireJwtAuth`
  - Request Body: `ShareLink`

- **DELETE** `/:shareId`
  - Description: ลบ shared link
  - Files:
    - `api/server/routes/share.js`
    - `api/server/controllers/ShareController.js`
  - Middleware: `requireJwtAuth`

- **GET** `/:shareId`
  - Description: ดึงข้อความที่แชร์
  - Files:
    - `api/server/routes/share.js`
    - `api/server/controllers/ShareController.js`
  - Middleware: `requireJwtAuth` (ถ้า `ALLOW_SHARED_LINKS_PUBLIC` เป็น `false`)
  - Response: `SharedMessages`

## Tags API
**Base URL**: `/tags`

- **GET** `/`
  - Description: ดึงรายการ tags ทั้งหมดของผู้ใช้
  - Files:
    - `api/server/routes/tags.js`
    - `api/server/controllers/TagController.js`
  - Middleware: `requireJwtAuth`, `checkBookmarkAccess`
  - Response: `Tag[]`

- **POST** `/`
  - Description: สร้าง tag ใหม่
  - Files:
    - `api/server/routes/tags.js`
    - `api/server/controllers/TagController.js`
  - Middleware: `requireJwtAuth`, `checkBookmarkAccess`
  - Request Body: `Tag`

- **PUT** `/:tag`
  - Description: อัปเดต tag ที่มีอยู่
  - Files:
    - `api/server/routes/tags.js`
    - `api/server/controllers/TagController.js`
  - Middleware: `requireJwtAuth`, `checkBookmarkAccess`
  - Request Body: `Tag`

- **DELETE** `/:tag`
  - Description: ลบ tag
  - Files:
    - `api/server/routes/tags.js`
    - `api/server/controllers/TagController.js`
  - Middleware: `requireJwtAuth`, `checkBookmarkAccess`

- **PUT** `/convo/:conversationId`
  - Description: อัปเดต tags ของบทสนทนา
  - Files:
    - `api/server/routes/tags.js`
    - `api/server/controllers/TagController.js`
  - Middleware: `requireJwtAuth`, `checkBookmarkAccess`
  - Request Body:
    ```typescript
    {
      tags: string[];  // รายการ tags ใหม่
    }
    ```

## Tokenizer API
**Base URL**: `/tokenizer`

- **POST** `/`
  - Description: นับจำนวน tokens ของข้อความ
  - Files:
    - `api/server/routes/tokenizer.js`
    - `api/server/controllers/TokenizerController.js`
  - Middleware: `requireJwtAuth`
  - Request Body:
    ```typescript
    {
      arg: string | { text: string };  // ข้อความที่ต้องการนับ tokens
    }
    ```
  - Response:
    ```typescript
    {
      count: number;  // จำนวน tokens
    }
    ```

## Banner API
**Base URL**: `/banner`

- **GET** `/`
  - Description: ดึงข้อมูล banner
  - Files:
    - `api/server/routes/banner.js`
    - `api/server/controllers/BannerController.js`
  - Middleware: `optionalJwtAuth`
  - Response: `Banner`

## Categories API
**Base URL**: `/categories`

- **GET** `/`
  - Description: ดึงรายการหมวดหมู่ทั้งหมด
  - Files:
    - `api/server/routes/categories.js`
    - `api/server/controllers/CategoryController.js`
  - Middleware: `requireJwtAuth`
  - Response: `Category[]`

## Config API
**Base URL**: `/config`

- **GET** `/`
  - Description: ดึงการตั้งค่าเริ่มต้นของระบบ
  - Files:
    - `api/server/routes/config.js`
    - `api/server/controllers/ConfigController.js`
  - Response:
    ```typescript
    {
      appTitle: string;
      socialLogins: SocialLogin[];
      discordLoginEnabled: boolean;
      facebookLoginEnabled: boolean;
      githubLoginEnabled: boolean;
      googleLoginEnabled: boolean;
      appleLoginEnabled: boolean;
      openidLoginEnabled: boolean;
      openidLabel: string;
      openidImageUrl: string;
      openidAutoRedirect: boolean;
      samlLoginEnabled: boolean;
      samlLabel: string;
      samlImageUrl: string;
      serverDomain: string;
      emailLoginEnabled: boolean;
      registrationEnabled: boolean;
      socialLoginEnabled: boolean;
      emailEnabled: boolean;
      passwordResetEnabled: boolean;
      showBirthdayIcon: boolean;
      helpAndFaqURL: string;
      interface: InterfaceConfig;
      turnstile: TurnstileConfig;
      modelSpecs: ModelSpecs;
      balance: BalanceConfig;
      sharedLinksEnabled: boolean;
      publicSharedLinksEnabled: boolean;
      analyticsGtmId: string;
      instanceProjectId: string;
      bundlerURL: string;
      staticBundlerURL: string;
      webSearch?: {
        searchProvider?: string;
        scraperType?: string;
        rerankerType?: string;
      };
      ldap?: LDAPConfig;
      customFooter?: string;
    }
    ```

## Conversations API
**Base URL**: `/convos`

- **GET** `/`
  - Description: ดึงรายการบทสนทนาทั้งหมด
  - Files:
    - `api/server/routes/conversations.js`
    - `api/server/controllers/ConversationController.js`
  - Middleware: `requireJwtAuth`
  - Query Parameters:
    ```typescript
    {
      limit?: number;        // จำนวนรายการต่อหน้า
      cursor?: string;       // cursor สำหรับ pagination
      isArchived?: boolean;  // แสดงเฉพาะบทสนทนาที่เก็บไว้
      search?: string;       // ค้นหาบทสนทนา
      order?: 'asc' | 'desc';  // ทิศทางการเรียงลำดับ
      tags?: string[];       // กรองตาม tags
    }
    ```

- **GET** `/:conversationId`
  - Description: ดึงข้อมูลบทสนทนาเฉพาะ
  - Files:
    - `api/server/routes/conversations.js`
    - `api/server/controllers/ConversationController.js`
  - Middleware: `requireJwtAuth`
  - Response: `Conversation`

- **POST** `/gen_title`
  - Description: สร้างชื่อบทสนทนา
  - Files:
    - `api/server/routes/conversations.js`
    - `api/server/controllers/ConversationController.js`
  - Middleware: `requireJwtAuth`
  - Request Body:
    ```typescript
    {
      conversationId: string;  // ID ของบทสนทนา
    }
    ```

- **DELETE** `/`
  - Description: ลบบทสนทนา
  - Files:
    - `api/server/routes/conversations.js`
    - `api/server/controllers/ConversationController.js`
  - Middleware: `requireJwtAuth`
  - Request Body:
    ```typescript
    {
      arg: {
        conversationId?: string;  // ID ของบทสนทนา
        source?: string;          // แหล่งที่มา
        thread_id?: string;       // ID ของ thread
        endpoint?: string;        // endpoint ที่ใช้
      }
    }
    ```

- **DELETE** `/all`
  - Description: ลบบทสนทนาทั้งหมด
  - Files:
    - `api/server/routes/conversations.js`
    - `api/server/controllers/ConversationController.js`
  - Middleware: `requireJwtAuth`

- **POST** `/update`
  - Description: อัปเดตข้อมูลบทสนทนา
  - Files:
    - `api/server/routes/conversations.js`
    - `api/server/controllers/ConversationController.js`
  - Middleware: `requireJwtAuth`
  - Request Body:
    ```typescript
    {
      arg: {
        conversationId: string;  // ID ของบทสนทนา
        // ข้อมูลอื่นๆ ที่ต้องการอัปเดต
      }
    }
    ```

- **POST** `/import`
  - Description: นำเข้าบทสนทนาจากไฟล์ JSON
  - Files:
    - `api/server/routes/conversations.js`
    - `api/server/controllers/ConversationController.js`
  - Middleware: `requireJwtAuth`, `importIpLimiter`, `importUserLimiter`
  - Request Body: `multipart/form-data` with file

- **POST** `/fork`
  - Description: แยกบทสนทนา
  - Files:
    - `api/server/routes/conversations.js`
    - `api/server/controllers/ConversationController.js`
  - Middleware: `requireJwtAuth`
  - Request Body:
    ```typescript
    {
      conversationId: string;     // ID ของบทสนทนาเดิม
      messageId: string;          // ID ของข้อความที่ต้องการแยก
      option: string;             // ตัวเลือกการแยก
      splitAtTarget: boolean;     // แยกที่ข้อความเป้าหมาย
      latestMessageId: string;    // ID ของข้อความล่าสุด
    }
    ```

- **POST** `/duplicate`
  - Description: สร้างบทสนทนาใหม่จากบทสนทนาเดิม
  - Files:
    - `api/server/routes/conversations.js`
    - `api/server/controllers/ConversationController.js`
  - Middleware: `requireJwtAuth`
  - Request Body:
    ```typescript
    {
      conversationId: string;  // ID ของบทสนทนาเดิม
      title?: string;          // ชื่อบทสนทนาใหม่
    }
    ```

## Keys API
**Base URL**: `/keys`

- **PUT** `/`
  - Description: อัปเดต API key ของผู้ใช้
  - Files:
    - `api/server/routes/keys.js`
    - `api/server/controllers/KeyController.js`
  - Middleware: `requireJwtAuth`
  - Request Body:
    ```typescript
    {
      name: string;     // ชื่อ key
      value: string;    // ค่า key
      expiresAt?: Date; // วันหมดอายุ
    }
    ```

- **DELETE** `/:name`
  - Description: ลบ API key ตามชื่อ
  - Files:
    - `api/server/routes/keys.js`
    - `api/server/controllers/KeyController.js`
  - Middleware: `requireJwtAuth`

- **DELETE** `/`
  - Description: ลบ API keys ทั้งหมด
  - Files:
    - `api/server/routes/keys.js`
    - `api/server/controllers/KeyController.js`
  - Middleware: `requireJwtAuth`
  - Query Parameters:
    ```typescript
    {
      all: 'true';  // ต้องระบุ all=true เพื่อลบทั้งหมด
    }
    ```

- **GET** `/`
  - Description: ดึงข้อมูลวันหมดอายุของ API key
  - Files:
    - `api/server/routes/keys.js`
    - `api/server/controllers/KeyController.js`
  - Middleware: `requireJwtAuth`
  - Query Parameters:
    ```typescript
    {
      name?: string;  // ชื่อ key ที่ต้องการตรวจสอบ
    }
    ```

## Plugins API
**Base URL**: `/plugins`

- **GET** `/`
  - Description: ดึงรายการ plugins ที่ใช้งานได้
  - Files:
    - `api/server/routes/plugins.js`
    - `api/server/controllers/PluginController.js`
  - Middleware: `requireJwtAuth`
  - Response: `Plugin[]`

## Presets API
**Base URL**: `/presets`

- **GET** `/`
  - Description: ดึงรายการ presets ทั้งหมดของผู้ใช้
  - Files:
    - `api/server/routes/presets.js`
    - `api/server/controllers/PresetController.js`
  - Middleware: `requireJwtAuth`
  - Response: `Preset[]`

- **POST** `/`
  - Description: สร้างหรืออัปเดต preset
  - Files:
    - `api/server/routes/presets.js`
    - `api/server/controllers/PresetController.js`
  - Middleware: `requireJwtAuth`
  - Request Body:
    ```typescript
    {
      presetId?: string;  // ID ของ preset (ถ้าไม่ระบุจะสร้างใหม่)
      // ข้อมูลอื่นๆ ของ preset
    }
    ```

- **POST** `/delete`
  - Description: ลบ preset
  - Files:
    - `api/server/routes/presets.js`
    - `api/server/controllers/PresetController.js`
  - Middleware: `requireJwtAuth`
  - Request Body:
    ```typescript
    {
      presetId?: string;  // ID ของ preset ที่ต้องการลบ
    }
    ```

## Search API
**Base URL**: `/search`

- **GET** `/enable`
  - Description: ตรวจสอบสถานะการใช้งาน MeiliSearch
  - Files:
    - `api/server/routes/search.js`
    - `api/server/controllers/SearchController.js`
  - Middleware: `requireJwtAuth`
  - Response: `boolean`

## Actions API
**Base URL**: `/actions`

- **GET** `/:action_id/oauth/callback`
  - Description: จัดการ OAuth callback และแลก authorization code เป็น tokens
  - Files:
    - `api/server/routes/actions.js`
    - `api/server/controllers/ActionController.js`
  - Query Parameters:
    ```typescript
    {
      code: string;   // authorization code จาก provider
      state: string;  // state token สำหรับตรวจสอบความถูกต้อง
    }
    ```
  - Response: HTML page แสดงผลการยืนยันตัวตน

## OAuth API
**Base URL**: `/oauth`

- **GET** `/error`
  - Description: จัดการข้อผิดพลาดในการยืนยันตัวตน
  - Files:
    - `api/server/routes/oauth.js`
    - `api/server/controllers/OAuthController.js`
  - Response: Redirect ไปยังหน้า login

### Google
- **GET** `/google`
  - Description: เริ่มการยืนยันตัวตนด้วย Google
  - Files:
    - `api/server/routes/oauth.js`
    - `api/server/controllers/OAuthController.js`
  - Scope: `openid`, `profile`, `email`

- **GET** `/google/callback`
  - Description: จัดการ callback จาก Google
  - Files:
    - `api/server/routes/oauth.js`
    - `api/server/controllers/OAuthController.js`
  - Middleware: `setBalanceConfig`

### Facebook
- **GET** `/facebook`
  - Description: เริ่มการยืนยันตัวตนด้วย Facebook
  - Files:
    - `api/server/routes/oauth.js`
    - `api/server/controllers/OAuthController.js`
  - Scope: `public_profile`
  - Profile Fields: `id`, `email`, `name`

- **GET** `/facebook/callback`
  - Description: จัดการ callback จาก Facebook
  - Files:
    - `api/server/routes/oauth.js`
    - `api/server/controllers/OAuthController.js`
  - Middleware: `setBalanceConfig`

### OpenID
- **GET** `/openid`
  - Description: เริ่มการยืนยันตัวตนด้วย OpenID
  - Files:
    - `api/server/routes/oauth.js`
    - `api/server/controllers/OAuthController.js`
  - State: Random state token

- **GET** `/openid/callback`
  - Description: จัดการ callback จาก OpenID
  - Files:
    - `api/server/routes/oauth.js`
    - `api/server/controllers/OAuthController.js`
  - Middleware: `setBalanceConfig`

### GitHub
- **GET** `/github`
  - Description: เริ่มการยืนยันตัวตนด้วย GitHub
  - Files:
    - `api/server/routes/oauth.js`
    - `api/server/controllers/OAuthController.js`
  - Scope: `user:email`, `read:user`

- **GET** `/github/callback`
  - Description: จัดการ callback จาก GitHub
  - Files:
    - `api/server/routes/oauth.js`
    - `api/server/controllers/OAuthController.js`
  - Middleware: `setBalanceConfig`

### Discord
- **GET** `/discord`
  - Description: เริ่มการยืนยันตัวตนด้วย Discord
  - Files:
    - `api/server/routes/oauth.js`
    - `api/server/controllers/OAuthController.js`
  - Scope: `identify`, `email`

- **GET** `/discord/callback`
  - Description: จัดการ callback จาก Discord
  - Files:
    - `api/server/routes/oauth.js`
    - `api/server/controllers/OAuthController.js`
  - Middleware: `setBalanceConfig`

### Apple
- **GET** `/apple`
  - Description: เริ่มการยืนยันตัวตนด้วย Apple
  - Files:
    - `api/server/routes/oauth.js`
    - `api/server/controllers/OAuthController.js`

- **POST** `/apple/callback`
  - Description: จัดการ callback จาก Apple
  - Files:
    - `api/server/routes/oauth.js`
    - `api/server/controllers/OAuthController.js`
  - Middleware: `setBalanceConfig`

### SAML
- **GET** `/saml`
  - Description: เริ่มการยืนยันตัวตนด้วย SAML
  - Files:
    - `api/server/routes/oauth.js`
    - `api/server/controllers/OAuthController.js`

- **POST** `/saml/callback`
  - Description: จัดการ callback จาก SAML
  - Files:
    - `api/server/routes/oauth.js`
    - `api/server/controllers/OAuthController.js`
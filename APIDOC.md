# API Documentation

This document provides a comprehensive list of all API endpoints, their associated files, middleware, and controllers.

## Authentication Endpoints

### `/api/auth`
- **Route**: `api/server/routes/auth.js`
- **Controllers**:
  - `api/server/controllers/AuthController.js`
    - `loginController`
    - `registerController`
    - `verifyEmailController`
    - `resetPasswordController`
    - `changePasswordController`
  - `api/server/controllers/auth/LoginController.js`
    - `handleLogin`
    - `handleTwoFactorAuth`
  - `api/server/controllers/auth/LogoutController.js`
    - `handleLogout`
  - `api/server/controllers/auth/TwoFactorAuthController.js`
    - `setupTwoFactor`
    - `verifyTwoFactor`
    - `disableTwoFactor`
  - `api/server/controllers/TwoFactorController.js`
    - `generateSecret`
    - `verifyToken`
- **Middleware**:
  - `api/server/middleware/checkBan.js`
  - `api/server/middleware/logHeaders.js`
  - `api/server/middleware/loginLimiter.js`
  - `api/server/middleware/requireJwtAuth.js`
  - `api/server/middleware/checkInviteUser.js`
  - `api/server/middleware/registerLimiter.js`
  - `api/server/middleware/requireLdapAuth.js`
  - `api/server/middleware/setBalanceConfig.js`
  - `api/server/middleware/requireLocalAuth.js`
  - `api/server/middleware/resetPasswordLimiter.js`
  - `api/server/middleware/validateRegistration.js`
  - `api/server/middleware/validatePasswordReset.js`
- **Endpoints**:
  - POST `/api/auth/login` - User login
  - POST `/api/auth/register` - User registration
  - POST `/api/auth/verify-email` - Verify email address
  - POST `/api/auth/reset-password` - Request password reset
  - PUT `/api/auth/reset-password` - Reset password with token
  - PUT `/api/auth/change-password` - Change password
  - POST `/api/auth/2fa/setup` - Setup two-factor authentication
  - POST `/api/auth/2fa/verify` - Verify two-factor authentication
  - DELETE `/api/auth/2fa` - Disable two-factor authentication
  - POST `/api/auth/logout` - User logout

### `/oauth`
- **Route**: `api/server/routes/oauth.js`
- **Controllers**:
  - `api/server/controllers/OAuthController.js`
    - `handleGoogleAuth`
    - `handleGoogleCallback`
    - `handleMicrosoftAuth`
    - `handleMicrosoftCallback`
    - `handleGithubAuth`
    - `handleGithubCallback`
- **Middleware**:
  - `api/server/middleware/checkBan.js`
  - `api/server/middleware/logHeaders.js`
  - `api/server/middleware/loginLimiter.js`
  - `api/server/middleware/setBalanceConfig.js`
  - `api/server/middleware/checkDomainAllowed.js`
- **Endpoints**:
  - GET `/oauth/google` - Google OAuth login
  - GET `/oauth/google/callback` - Google OAuth callback
  - GET `/oauth/microsoft` - Microsoft OAuth login
  - GET `/oauth/microsoft/callback` - Microsoft OAuth callback
  - GET `/oauth/github` - GitHub OAuth login
  - GET `/oauth/github/callback` - GitHub OAuth callback

## User Management Endpoints

### `/api/user`
- **Route**: `api/server/routes/user.js` (and `api/custom/routes/user.js`)
- **Controllers**:
  - `api/server/controllers/UserController.js`
  - `api/custom/controllers/admin.js`
  - `api/custom/controllers/schooladmin.js`
- **Middleware**:
  - `api/server/middleware/requireJwtAuth.js`
  - `api/server/middleware/checkAdmin.js`
  - `api/server/middleware/verifyEmailLimiter.js`
- **Endpoints**:
  - GET `/api/user/usage-permission` - Check user usage permission
  - GET `/api/user/admin/count-by-school` - Get user count by school
  - GET `/api/user/admin/schools-without-admin` - Get schools without admin
  - GET `/api/user/admin/users-without-school` - Get users without school
  - GET `/api/user/admin/schools-with-admin` - Get schools with admin
  - GET `/api/user/admin/users/school/:schoolId` - Get users by school
  - GET `/api/user/admin/users-registered-today` - Get users registered today
  - PUT `/api/user/admin/users/:userId/school-admin` - Update user school admin
  - POST `/api/user/admin/users/update-school` - Update users school
  - PUT `/api/user/admin/users/make-admin` - Assign admin role
  - PUT `/api/user/admin/users/make-user` - Assign user role
  - GET `/api/user/search` - Search users (admin only)
  - GET `/api/user/:userId/balance` - Get user balance (admin only)
  - PUT `/api/user/admin/users/super-credit` - Update user super credit
  - POST `/api/user/school-admin/check-email` - Check email for school admin
  - POST `/api/user/school-admin/create-user` - Create user by school admin
  - POST `/api/user/school-admin/import-users` - Import users from xlsx
  - POST `/api/user/school-admin/revoke-user` - Revoke user from school
  - PUT `/api/user/school-admin/users/:userId/reset-password` - Reset user password by school admin

### `/api/roles`
- **Route**: `api/server/routes/roles.js`
- **Controllers**:
  - `api/server/models/Role.js`
- **Middleware**:
  - `api/server/middleware/requireJwtAuth.js`
  - `api/server/middleware/roles/`
  - `api/server/middleware/checkAdmin.js`
- **Endpoints**:
  - GET `/api/roles/:roleName` - ดึงข้อมูล role ตามชื่อ (เฉพาะ admin หรือ role ที่อนุญาต)
  - PUT `/api/roles/:roleName/prompts` - แก้ไขสิทธิ์การใช้งาน prompt ของ role นั้น ๆ (admin เท่านั้น)
  - PUT `/api/roles/:roleName/agents` - แก้ไขสิทธิ์การใช้งาน agent ของ role นั้น ๆ (admin เท่านั้น)
  - PUT `/api/roles/:roleName/memories` - แก้ไขสิทธิ์การใช้งาน memories ของ role นั้น ๆ (admin เท่านั้น)

## AI Interaction Endpoints

### `/api/ask`
- **Route**: `api/server/routes/ask/index.js`
- **Controllers**:
  - `api/server/controllers/AskController.js`
    - `handleAsk`
    - `handleStreamAsk`
    - `handleAbortAsk`
    - `handleFeedback`
- **Middleware**:
  - `api/server/middleware/uaParser.js`
  - `api/server/middleware/checkBan.js`
  - `api/server/middleware/requireJwtAuth.js`
  - `api/server/middleware/messageIpLimiter.js`
  - `api/server/middleware/concurrentLimiter.js`
  - `api/server/middleware/messageUserLimiter.js`
  - `api/server/middleware/validateConvoAccess.js`
  - `api/server/middleware/setHeaders.js`
  - `api/server/middleware/validateModel.js`
  - `api/server/middleware/validateEndpoint.js`
  - `api/server/middleware/buildEndpointOption.js`
  - `api/server/middleware/moderateText.js`
- **Endpoints**:
  - POST `/api/ask` - Send a question to AI
  - POST `/api/ask/stream` - Stream AI response
  - POST `/api/ask/abort` - Abort current AI request
  - POST `/api/ask/feedback` - Submit feedback for AI response

### `/api/edit`
- **Route**: `api/server/routes/edit/index.js`
- **Controllers**:
  - `api/server/controllers/EditController.js`
    - `handleEdit`
    - `handleStreamEdit`
    - `handleAbortEdit`
    - `handleEditFeedback`
- **Middleware**:
  - `api/server/middleware/setHeaders.js`
  - `api/server/middleware/validateModel.js`
  - `api/server/middleware/validateEndpoint.js`
  - `api/server/middleware/buildEndpointOption.js`
  - `api/server/middleware/moderateText.js`
- **Endpoints**:
  - POST `/api/edit` - Edit text with AI
  - POST `/api/edit/stream` - Stream AI edit response
  - POST `/api/edit/abort` - Abort current edit request
  - POST `/api/edit/feedback` - Submit feedback for edit

### `/api/assistants`
- **Route**: `api/server/routes/assistants/index.js`
- **Controllers**:
  - `api/server/controllers/assistants/v1.js`
    - `createAssistant`
    - `getAssistant`
    - `updateAssistant`
    - `deleteAssistant`
    - `listAssistants`
  - `api/server/controllers/assistants/v2.js`
    - `createAssistantV2`
    - `getAssistantV2`
    - `updateAssistantV2`
    - `deleteAssistantV2`
    - `listAssistantsV2`
- **Middleware**:
  - `api/server/middleware/uaParser.js`
  - `api/server/middleware/checkBan.js`
  - `api/server/middleware/requireJwtAuth.js`
- **Endpoints**:
  - POST `/api/assistants` - Create new assistant
  - GET `/api/assistants/:id` - Get assistant details
  - PUT `/api/assistants/:id` - Update assistant
  - DELETE `/api/assistants/:id` - Delete assistant
  - GET `/api/assistants` - List all assistants
  - POST `/api/assistants/v2` - Create new assistant (v2)
  - GET `/api/assistants/v2/:id` - Get assistant details (v2)
  - PUT `/api/assistants/v2/:id` - Update assistant (v2)
  - DELETE `/api/assistants/v2/:id` - Delete assistant (v2)
  - GET `/api/assistants/v2` - List all assistants (v2)

### `/api/agents`
- **Route**: `api/server/routes/agents/v1.js`
- **Controllers**:
  - `api/server/controllers/agents/v1.js`
    - `createAgent`
    - `getAgent`
    - `updateAgent`
    - `deleteAgent`
    - `listAgents`
    - `runAgent`
    - `stopAgent`
- **Middleware**:
  - `api/server/middleware/requireJwtAuth.js`
- **Endpoints**:
  - POST `/api/agents` - Create new agent
  - GET `/api/agents/:id` - Get agent details
  - PUT `/api/agents/:id` - Update agent
  - DELETE `/api/agents/:id` - Delete agent
  - GET `/api/agents` - List all agents
  - POST `/api/agents/:id/run` - Run agent
  - POST `/api/agents/:id/stop` - Stop agent

## File Management Endpoints

### `/api/files`
- **Route**: `api/server/routes/files/index.js`
- **Controllers**:
  - `api/server/controllers/files/files.js`
    - `uploadFile`
    - `downloadFile`
    - `deleteFile`
    - `listFiles`
  - `api/server/controllers/files/images.js`
    - `uploadImage`
    - `resizeImage`
    - `deleteImage`
  - `api/server/controllers/files/avatar.js`
    - `uploadAvatar`
    - `updateAvatar`
    - `deleteAvatar`
  - `api/server/controllers/files/speech.js`
    - `textToSpeech`
    - `speechToText`
- **Middleware**:
  - `api/server/middleware/uaParser.js`
  - `api/server/middleware/checkBan.js`
  - `api/server/middleware/requireJwtAuth.js`
  - `api/server/middleware/createFileLimiters.js`
  - `api/server/middleware/validateImageRequest.js`
- **Endpoints**:
  - POST `/api/files/upload` - Upload file
  - GET `/api/files/:id` - Download file
  - DELETE `/api/files/:id` - Delete file
  - GET `/api/files` - List files
  - POST `/api/files/images` - Upload image
  - POST `/api/files/images/resize` - Resize image
  - DELETE `/api/files/images/:id` - Delete image
  - POST `/api/files/avatar` - Upload avatar
  - PUT `/api/files/avatar` - Update avatar
  - DELETE `/api/files/avatar` - Delete avatar
  - POST `/api/files/speech/tts` - Convert text to speech
  - POST `/api/files/speech/stt` - Convert speech to text

### `/images/`
- **Route**: `api/server/routes/static.js`
- **Controllers**:
  - N/A (Static file serving)
- **Middleware**:
  - `api/server/middleware/validateImageRequest.js`
- **Endpoints**:
  - N/A (See route file)

## Configuration Endpoints

### `/api/models`
- **Route**: `api/server/routes/models.js`
- **Controllers**:
  - `api/server/controllers/ModelController.js`
    - `getModels`
    - `getModel`
    - `updateModel`
    - `deleteModel`
    - `createModel`
    - `validateModel`
- **Middleware**:
  - `api/server/middleware/requireJwtAuth.js`
- **Endpoints**:
  - GET `/api/models` - List all models
  - GET `/api/models/:id` - Get model details
  - PUT `/api/models/:id` - Update model
  - DELETE `/api/models/:id` - Delete model
  - POST `/api/models` - Create new model
  - POST `/api/models/validate` - Validate model configuration

### `/api/endpoints`
- **Route**: `api/server/routes/endpoints.js`
- **Controllers**:
  - `api/server/controllers/EndpointController.js`
    - `getEndpoints`
    - `getEndpoint`
    - `createEndpoint`
    - `updateEndpoint`
    - `deleteEndpoint`
  - `api/server/controllers/OverrideController.js`
    - `getOverrides`
    - `createOverride`
    - `updateOverride`
    - `deleteOverride`
- **Middleware**:
  - N/A (See route file)
- **Endpoints**:
  - GET `/api/endpoints` - List all endpoints
  - GET `/api/endpoints/:id` - Get endpoint details
  - POST `/api/endpoints` - Create new endpoint
  - PUT `/api/endpoints/:id` - Update endpoint
  - DELETE `/api/endpoints/:id` - Delete endpoint
  - GET `/api/endpoints/:id/overrides` - List endpoint overrides
  - POST `/api/endpoints/:id/overrides` - Create endpoint override
  - PUT `/api/endpoints/:id/overrides/:overrideId` - Update endpoint override
  - DELETE `/api/endpoints/:id/overrides/:overrideId` - Delete endpoint override

### `/api/plugins`
- **Route**: `api/server/routes/plugins.js`
- **Controllers**:
  - `api/server/controllers/PluginController.js`
    - `getPlugins`
    - `getPlugin`
    - `installPlugin`
    - `uninstallPlugin`
    - `updatePlugin`
    - `enablePlugin`
    - `disablePlugin`
- **Middleware**:
  - `api/server/middleware/requireJwtAuth.js`
- **Endpoints**:
  - GET `/api/plugins` - List all plugins
  - GET `/api/plugins/:id` - Get plugin details
  - POST `/api/plugins/install` - Install new plugin
  - DELETE `/api/plugins/:id` - Uninstall plugin
  - PUT `/api/plugins/:id` - Update plugin
  - PUT `/api/plugins/:id/enable` - Enable plugin
  - PUT `/api/plugins/:id/disable` - Disable plugin

## Conversation Management Endpoints

### `/api/messages`
- **Route**: `api/server/routes/messages.js`
- **Controllers**:
  - `api/server/controllers/MessageController.js`
    - `getMessages`
    - `getMessage`
    - `createMessage`
    - `updateMessage`
    - `deleteMessage`
    - `searchMessages`
- **Middleware**:
  - `api/server/middleware/requireJwtAuth.js`
  - `api/server/middleware/validateMessageReq.js`
- **Endpoints**:
  - GET `/api/messages` - List all messages
  - GET `/api/messages/:id` - Get message details
  - POST `/api/messages` - Create new message
  - PUT `/api/messages/:id` - Update message
  - DELETE `/api/messages/:id` - Delete message
  - GET `/api/messages/search` - Search messages

### `/api/convos`
- **Route**: `api/server/routes/convos.js`
- **Controllers**:
  - `api/server/controllers/ConvoController.js`
    - `getConvos`
    - `getConvo`
    - `createConvo`
    - `updateConvo`
    - `deleteConvo`
    - `archiveConvo`
- **Middleware**:
  - `api/server/middleware/requireJwtAuth.js`
- **Endpoints**:
  - GET `/api/convos` - List all conversations
  - GET `/api/convos/:id` - Get conversation details
  - POST `/api/convos` - Create new conversation
  - PUT `/api/convos/:id` - Update conversation
  - DELETE `/api/convos/:id` - Delete conversation
  - PUT `/api/convos/:id/archive` - Archive conversation

### `/api/presets`
- **Route**: `api/server/routes/presets.js`
- **Controllers**:
  - `api/server/controllers/PresetController.js`
    - `getPresets`
    - `getPreset`
    - `createPreset`
    - `updatePreset`
    - `deletePreset`
- **Middleware**:
  - `api/server/middleware/requireJwtAuth.js`
- **Endpoints**:
  - GET `/api/presets` - List all presets
  - GET `/api/presets/:id` - Get preset details
  - POST `/api/presets` - Create new preset
  - PUT `/api/presets/:id` - Update preset
  - DELETE `/api/presets/:id` - Delete preset

## Utility Endpoints

### `/api/categories`
- **Route**: `api/server/routes/categories.js`
- **Controllers**:
  - `api/server/controllers/CategoryController.js`
    - `getCategories`
    - `getCategory`
    - `createCategory`
    - `updateCategory`
    - `deleteCategory`
- **Middleware**:
  - `api/server/middleware/requireJwtAuth.js`
- **Endpoints**:
  - GET `/api/categories` - List all categories
  - GET `/api/categories/:id` - Get category details
  - POST `/api/categories` - Create new category
  - PUT `/api/categories/:id` - Update category
  - DELETE `/api/categories/:id` - Delete category

### `/api/tokenizer`
- **Route**: `api/server/routes/tokenizer.js`
- **Controllers**:
  - `api/server/controllers/TokenizerController.js`
    - `tokenizeText`
    - `countTokens`
    - `validateTokens`
- **Middleware**:
  - `api/server/middleware/requireJwtAuth.js`
- **Endpoints**:
  - POST `/api/tokenizer/tokenize` - Tokenize text
  - POST `/api/tokenizer/count` - Count tokens
  - POST `/api/tokenizer/validate` - Validate tokens

### `/api/banner`
- **Route**: `api/server/routes/banner.js`
- **Controllers**:
  - `api/server/controllers/BannerController.js`
    - `getBanners`
    - `getBanner`
    - `createBanner`
    - `updateBanner`
    - `deleteBanner`
- **Middleware**:
  - `api/server/middleware/optionalJwtAuth.js`
- **Endpoints**:
  - GET `/api/banner` - List all banners
  - GET `/api/banner/:id` - Get banner details
  - POST `/api/banner` - Create new banner
  - PUT `/api/banner/:id` - Update banner
  - DELETE `/api/banner/:id` - Delete banner

### `/api/memories`
- **Route**: `api/server/routes/memories.js`
- **Controllers**:
  - `api/server/controllers/MemoryController.js`
    - `getMemories`
    - `getMemory`
    - `createMemory`
    - `updateMemory`
    - `deleteMemory`
    - `searchMemories`
- **Middleware**:
  - `api/server/middleware/requireJwtAuth.js`
- **Endpoints**:
  - GET `/api/memories` - List all memories
  - GET `/api/memories/:id` - Get memory details
  - POST `/api/memories` - Create new memory
  - PUT `/api/memories/:id` - Update memory
  - DELETE `/api/memories/:id` - Delete memory
  - GET `/api/memories/search` - Search memories

### `/api/tags`
- **Route**: `api/server/routes/tags.js`
- **Controllers**:
  - `api/server/controllers/TagController.js`
    - `getTags`
    - `getTag`
    - `createTag`
    - `updateTag`
    - `deleteTag`
    - `searchTags`
- **Middleware**:
  - `api/server/middleware/requireJwtAuth.js`
- **Endpoints**:
  - GET `/api/tags` - List all tags
  - GET `/api/tags/:id` - Get tag details
  - POST `/api/tags` - Create new tag
  - PUT `/api/tags/:id` - Update tag
  - DELETE `/api/tags/:id` - Delete tag
  - GET `/api/tags/search` - Search tags

### `/api/actions`
- **Route**:
  - `api/server/routes/actions.js`
  - `api/server/routes/agents/actions.js`
  - `api/server/routes/assistants/actions.js`
- **Controllers**:
  - `api/server/controllers/ActionController.js` (callback OAuth)
  - `api/server/controllers/agents/v1.js` (agent actions)
  - `api/server/controllers/assistants/v1.js` (assistant actions)
- **Middleware**:
  - `api/server/middleware/requireJwtAuth.js`
- **Endpoints**:
  - GET `/api/actions/` - ดึง actions ทั้งหมดของผู้ใช้ (หรือทั้งหมดถ้าเป็น admin)
  - POST `/api/actions/:agent_id` - เพิ่มหรืออัปเดต action สำหรับ agent
  - DELETE `/api/actions/:agent_id/:action_id` - ลบ action ของ agent
  - POST `/api/actions/:assistant_id` - เพิ่มหรืออัปเดต action สำหรับ assistant
  - DELETE `/api/actions/:assistant_id/:action_id/:model` - ลบ action ของ assistant
  - GET `/api/actions/:action_id/oauth/callback` - OAuth callback สำหรับ action

### `/api/keys`
- **Route**: `api/server/routes/keys.js`
- **Controllers**:
  - `api/server/controllers/KeyController.js` (ถ้ามี)
  - `api/server/services/UserService.js` (service logic)
- **Middleware**:
  - `api/server/middleware/requireJwtAuth.js`
- **Endpoints**:
  - PUT `/api/keys/` - อัปเดต/เพิ่ม API key ของผู้ใช้
  - DELETE `/api/keys/:name` - ลบ API key ตามชื่อ
  - DELETE `/api/keys?all=true` - ลบ API keys ทั้งหมด
  - GET `/api/keys/` - ดูวันหมดอายุของ key (query param: name)

### `/api/search`
- **Route**:
- **Controllers**:
  - `api/server/controllers/SearchController.js` (ถ้ามี)
- **Middleware**:
  - `api/server/middleware/requireJwtAuth.js`
- **Endpoints**:
  - GET `/api/search/enable` - ตรวจสอบว่าสามารถใช้ MeiliSearch ได้หรือไม่ (คืนค่า boolean)

### `/api/prompts`
- **Route**:
- **Controllers**:
  - `api/server/controllers/PromptController.js`
- **Middleware**:
  - `api/server/middleware/requireJwtAuth.js`
  - `api/server/middleware/roles/` (สำหรับสิทธิ์)
- **Endpoints**:
  - GET `/api/prompts/groups/:groupId` - ดู prompt group ตาม id
  - GET `/api/prompts/all` - ดู prompt groups ทั้งหมด
  - GET `/api/prompts/groups` - ดู prompt groups แบบ paginated
  - POST `/api/prompts/` - สร้าง prompt หรือ prompt group ใหม่
  - PATCH `/api/prompts/:promptId/tags/production` - อัปเดต prompt เป็น production
  - GET `/api/prompts/:promptId` - ดู prompt ตาม id
  - GET `/api/prompts/` - ดู prompt ทั้งหมด (query: groupId)
  - DELETE `/api/prompts/:promptId` - ลบ prompt
  - DELETE `/api/prompts/groups/:groupId` - ลบ prompt group

## Balance Endpoint

### `/api/balance`
- **Route**: `api/server/routes/balance.js`
- **Controllers**:
  - `api/server/controllers/Balance.js`
    - `balanceController`
- **Middleware**:
  - `api/server/middleware/requireJwtAuth.js`
- **Endpoints**:
  - GET `/api/balance` - ดูข้อมูล balance ของผู้ใช้ปัจจุบัน

## Custom/School/Coupon/Admin Endpoints

### `/api/school`
- **Route**: `api/custom/routes/school.js`
- **Controllers**:
  - `api/custom/models/SchoolPremium`
    - `calcBillPeriod`
    - `createSchoolPremium`
    - `readSchoolPremium`
    - `readAllSchoolPremium`
    - `updateSchoolPremium`
  - `api/custom/models/balanceUtil`
    - `getSchoolCurrentBillToken`
  - `api/custom/models/schema/school`
- **Middleware**:
  - `api/server/middleware/requireJwtAuth.js`
  - `api/server/middleware/checkAdmin.js`
- **Endpoints**:
  - GET `/api/school/premium/all` - ดูข้อมูล premium ของทุกโรงเรียน (admin เท่านั้น)
  - POST `/api/school/premium/update` - สร้างหรืออัปเดตข้อมูล premium ของโรงเรียน (admin เท่านั้น)
  - GET `/api/school/premium/:school` - ดูข้อมูล premium ของโรงเรียนตาม id
  - GET `/api/school/period/:schoolId` - คำนวณรอบบิลของโรงเรียน
  - GET `/api/school/balance` - ดูยอด balance ของโรงเรียน (private เฉพาะผู้ใช้ที่มีโรงเรียน)

### `/api/coupon`
- **Route**: `api/custom/routes/coupon.js`
- **Controllers**:
  - `api/custom/models/Coupon`
    - `createCoupon`
    - `getAllCoupons`
    - `getCouponByCode`
    - `updateCoupon`
    - `deleteCoupon`
  - `api/custom/models/CouponLog`
    - `redeemCoupon`
    - `getUserCouponLogs`
- **Middleware**:
  - `api/server/middleware/requireJwtAuth.js`
  - `api/server/middleware/checkAdmin.js` (บาง endpoint)
- **Endpoints**:
  - GET `/api/coupon` - ดูคูปองทั้งหมด (admin เท่านั้น)
  - GET `/api/coupon/logs/me` - ดูประวัติการใช้คูปองของตัวเอง
  - GET `/api/coupon/:couponcode` - ดูข้อมูลคูปองตามรหัส (admin เท่านั้น)
  - POST `/api/coupon` - สร้างคูปองใหม่ (admin เท่านั้น)
  - PUT `/api/coupon/:couponcode` - อัปเดตคูปอง (admin เท่านั้น)
  - DELETE `/api/coupon/:couponcode` - ลบคูปอง (admin เท่านั้น)
  - POST `/api/coupon/redeem` - ใช้คูปองเพื่อรับเครดิต

### `/api/custom-balance`
- **Route**: `api/custom/routes/balance.js`
- **Controllers**:
  - `api/custom/utils/balanceUtils`
    - `triggerAutoRefill`
  - `api/custom/controllers/cache`
    - `clearSchoolBillTokenCacheController`
- **Middleware**:
  - `api/server/middleware/requireJwtAuth.js`
- **Endpoints**:
  - POST `/api/custom-balance/auto-refill` - สั่งเติมเครดิตอัตโนมัติ (private)
  - POST `/api/custom-balance/clear-school-cache` - ล้าง cache ของ school bill token (private)

### `/api/admin`
- **Route**: `api/custom/routes/admin.js`
- **Controllers**:
  - `api/custom/controllers/admin`
    - `adminImpersonateController`
    - `endImpersonateController`
- **Middleware**:
  - `api/server/middleware/requireJwtAuth.js`
  - `api/server/middleware/checkAdmin.js`
- **Endpoints**:
  - POST `/api/admin/impersonate` - สลับตัวตนเป็นผู้ใช้คนอื่น (admin เท่านั้น)
  - POST `/api/admin/end-impersonate` - สิ้นสุดการสลับตัวตนกลับไปเป็น admin เดิม

### `/api/custom-presets`
- **Route**: `api/custom/routes/presets.js`
- **Controllers**:
  - Inline ใน route (ไม่มี controller แยก)
- **Middleware**:
  - ไม่มี middleware เฉพาะ
- **Endpoints**:
  - GET `/api/custom-presets/max-context` - ดูค่า max context tokens จาก environment variable

## Configuration Endpoints

### `/api/config`
- **Route**: `api/server/routes/config.js`
- **Controllers**:
  - Inline ใน route (ไม่มี controller แยก)
- **Middleware**:
  - ไม่มี middleware เฉพาะ (ใช้ logic ใน route)
- **Endpoints**:
  - GET `/api/config` - ดึงค่า config สำหรับ client (startup config, social login, ฯลฯ)

## Utility Endpoints

### `/api/share`
- **Route**: `api/server/routes/share.js`
- **Controllers**:
  - `api/models/Share.js`
    - `getSharedLink`
    - `getSharedMessages`
    - `createSharedLink`
    - `updateSharedLink`
    - `getSharedLinks`
    - `deleteSharedLink`
- **Middleware**:
  - `api/server/middleware/requireJwtAuth.js` (บาง endpoint)
- **Endpoints**:
  - GET `/api/share/:shareId` - ดูข้อความที่แชร์ (public หรือ auth)
  - GET `/api/share` - ดู shared links ของผู้ใช้
  - GET `/api/share/link/:conversationId` - ดู shared link ของ conversation
  - POST `/api/share/:conversationId` - สร้าง shared link
  - PATCH `/api/share/:shareId` - อัปเดต shared link
  - DELETE `/api/share/:shareId` - ลบ shared link

## AI Interaction Endpoints

### `/api/bedrock`
- **Route**: `api/server/routes/bedrock/index.js`
- **Controllers**:
  - `api/server/controllers/agents/request.js` (ใช้ผ่าน service)
- **Middleware**:
  - `api/server/middleware/requireJwtAuth.js`
  - `api/server/middleware/checkBan.js`
  - `api/server/middleware/uaParser.js`
  - `api/server/middleware/concurrentLimiter.js` (ถ้าเปิด)
  - `api/server/middleware/messageIpLimiter.js` (ถ้าเปิด)
  - `api/server/middleware/messageUserLimiter.js` (ถ้าเปิด)
  - `api/server/middleware/moderateText.js`
  - `api/server/middleware/buildEndpointOption.js`
  - `api/server/middleware/setHeaders.js`
- **Endpoints**:
  - POST `/api/bedrock/chat` - ส่งข้อความคุยกับ AI (Bedrock agent)
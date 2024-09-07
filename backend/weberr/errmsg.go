package weberr

const (
	// Success
	SUCCESS = 200

	// Client Errors
	BAD_REQUEST  = 400
	UNAUTHORIZED = 401
	FORBIDDEN    = 403
	NOT_FOUND    = 404

	// Server Errors
	INTERNAL_SERVER_ERROR = 500

	// Additional error codes
	METHOD_NOT_ALLOWED     = 405
	REQUEST_TIMEOUT        = 408
	CONFLICT               = 409
	GONE                   = 410
	UNSUPPORTED_MEDIA_TYPE = 415
	TOO_MANY_REQUESTS      = 429

	// Additional Client Errors
	USER_ALREADY_EXISTS = 1001 // Custom code for user already exists
	INVALID_PASSWORD    = 1002 // Custom code for incorrect password
	// Additional Server Errors
	DATABASE_ERROR          = 1003 // Custom code for database error
	USER_NOT_FOUND          = 1004
	INVALID_ID              = 1005
	CATEGORY_NOT_FOUND      = 1006
	CATEGORY_ALREADY_EXISTS = 1007
)

type ErrorCode struct {
	Code    int
	Message string
}

var errorCodes = map[int]ErrorCode{
	200:  {200, "OK"},
	400:  {400, "请求参数错误"},
	401:  {401, "未授权"},
	403:  {403, "禁止访问"},
	404:  {404, "请求资源不存在"},
	405:  {405, "方法不允许"},
	408:  {408, "请求超时"},
	409:  {409, "请求冲突"},
	410:  {410, "资源已删除"},
	415:  {415, "不支持的媒体类型"},
	429:  {429, "请求过多"},
	500:  {500, "服务器内部错误"},
	1001: {1001, "用户已存在"},
	1002: {1002, "密码错误"},
	1003: {1003, "数据库错误"},
	1004: {1004, "用户不存在"},
	1005: {1005, "无效的用户ID"},
	1006: {1006, "分类不存在"},
	1007: {1007, "分类已存在"},
}

func GetErr(code int) string {
	if err, ok := errorCodes[code]; ok {
		return err.Message
	}
	return "未知错误"
}

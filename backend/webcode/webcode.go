package webcode

const (
	SUCCESS             = 200
	ERROR               = 500
	USER_ALREADY_EXISTS = 502
	USER_NOT_FOUND      = 501
)

type ErrorCode struct {
	Code    int
	Message string
}

var errorCodes = map[int]ErrorCode{
	200: {200, "OK"},
	500: {500, "服务器内部错误"},
	501: {501, "用户不存在"},
	502: {502, "用户已存在"},
}

func GetCodeMessage(code int) string {
	if err, ok := errorCodes[code]; ok {
		return err.Message
	}
	return "未知错误"
}

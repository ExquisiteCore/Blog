package api

import (
	"backend/middleware"
	"backend/model"
	"backend/weberr"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func Login(c *gin.Context) {
	var data model.User
	var code int
	var token string
	c.ShouldBindJSON(&data)

	data, code = model.CheckLoginFront(data.Username, data.Password)
	if code == weberr.SUCCESS {
		setToken(c, data)
	} else {
		c.JSON(http.StatusOK, gin.H{
			"status":  code,
			"data":    data.Username,
			"id":      data.ID,
			"message": weberr.GetErr(code),
			"token":   token,
		})
	}
}

// token生成函数
func setToken(c *gin.Context, user model.User) {
	j := middleware.NewJWT()
	claims := middleware.MyClaims{
		Username: user.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			NotBefore: jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			Issuer:    "Blog",
		},
	}

	token, err := j.CreateToken(claims)

	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"status":  weberr.INTERNAL_SERVER_ERROR,
			"message": weberr.GetErr(weberr.INTERNAL_SERVER_ERROR),
			"token":   token,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  200,
		"data":    user.Username,
		"id":      user.ID,
		"message": weberr.GetErr(200),
		"token":   token,
	})
}

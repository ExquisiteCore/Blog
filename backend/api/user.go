package api

import (
	"backend/model"
	"backend/weberr"
	"net/http"

	"github.com/gin-gonic/gin"
)

// 添加用户
func AddUser(c *gin.Context) {

	var data model.User
	err := c.ShouldBindJSON(&data)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"code": weberr.DATABASE_ERROR,
			"msg":  weberr.GetErr(weberr.DATABASE_ERROR),
		})
		return
	}

	code := model.CheckUserExists(data.Username)
	if code == weberr.USER_NOT_FOUND {
		code = model.CreateUser(&data)
	}
	if code == weberr.USER_NOT_FOUND {
		code = weberr.SUCCESS
	}

	c.JSON(http.StatusOK, gin.H{
		"code": code,
		"data": data,
		"msg":  weberr.GetErr(code),
	})
}

// 删除用户
func DeleteUser(c *gin.Context) {

	// if err != nil {
	// 	c.JSON(http.StatusBadRequest, gin.H{
	// 		"code": weberr.INVALID_ID,
	// 		"msg":  weberr.GetErr(weberr.INVALID_ID),
	// 	})
	// 	return
	// }

	code := model.DeleteUser(c.Param("name"))

	c.JSON(
		http.StatusOK, gin.H{
			"code": code,
			"msg":  weberr.GetErr(code),
		},
	)
}

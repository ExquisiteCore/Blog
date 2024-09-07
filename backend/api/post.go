package api

import (
	"backend/model"
	"backend/weberr"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// 添加文章
func AddPost(c *gin.Context) {
	var data model.Post
	_ = c.ShouldBindJSON(&data)

	code := model.CreatePost(&data)

	c.JSON(http.StatusOK, gin.H{
		"code": code,
		"data": data,
		"msg":  weberr.GetErr(code),
	})
}

// 查询单个文章信息
func GetPostInfo(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	data, code := model.GetPostInfo(id)
	c.JSON(http.StatusOK, gin.H{
		"status":  code,
		"data":    data,
		"message": weberr.GetErr(code),
	})
}

// 查询分类下的所有文章
func GetCateArt(c *gin.Context) {
	pageSize, _ := strconv.Atoi(c.Query("pagesize"))
	pageNum, _ := strconv.Atoi(c.Query("pagenum"))
	id, _ := strconv.Atoi(c.Param("id"))

	switch {
	case pageSize >= 100:
		pageSize = 100
	case pageSize <= 0:
		pageSize = 10
	}

	if pageNum == 0 {
		pageNum = 1
	}

	data, code, total := model.GetCatePost(id, pageSize, pageNum)

	c.JSON(http.StatusOK, gin.H{
		"status":  code,
		"data":    data,
		"total":   total,
		"message": weberr.GetErr(code),
	})
}

// 查询文章列表
func GetPost(c *gin.Context) {
	pageSize, _ := strconv.Atoi(c.Query("pagesize"))
	pageNum, _ := strconv.Atoi(c.Query("pagenum"))
	title := c.Query("title")

	switch {
	case pageSize >= 100:
		pageSize = 100
	case pageSize <= 0:
		pageSize = 10
	}

	if pageNum == 0 {
		pageNum = 1
	}
	if len(title) == 0 {
		data, code, total := model.GetPost(pageSize, pageNum)
		c.JSON(http.StatusOK, gin.H{
			"status":  code,
			"data":    data,
			"total":   total,
			"message": weberr.GetErr(code),
		})
		return
	}

	data, code, total := model.SearchPosticle(title, pageSize, pageNum)
	c.JSON(http.StatusOK, gin.H{
		"status":  code,
		"data":    data,
		"total":   total,
		"message": weberr.GetErr(code),
	})
}

// 删除文章
func DeletePost(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))

	code := model.DeletePost(id)

	c.JSON(http.StatusOK, gin.H{
		"status":  code,
		"message": weberr.GetErr(code),
	})
}

package api

import (
	"backend/model"
	"backend/weberr"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// 添加分类
func AddCategory(c *gin.Context) {
	var data model.Category
	err := c.ShouldBindJSON(&data)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"code": weberr.DATABASE_ERROR,
			"msg":  weberr.GetErr(weberr.DATABASE_ERROR),
		})
		return
	}

	code := model.CheckCategoryExists(data.Name)
	if code == weberr.CATEGORY_NOT_FOUND {
		code = model.CreateCategory(&data)
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

// 查询分类下的文章
func GetCategory(c *gin.Context) {
}

// 删除分类
func DeleteCategory(c *gin.Context) {
	code := model.DeleteCategory(c.Param("name"))

	c.JSON(
		http.StatusOK, gin.H{
			"code": code,
			"msg":  weberr.GetErr(code),
		},
	)
}

// GetCate 查询分类列表
func GetCate(c *gin.Context) {
	pageSize, _ := strconv.Atoi(c.Query("pagesize"))
	pageNum, _ := strconv.Atoi(c.Query("pagenum"))

	switch {
	case pageSize >= 100:
		pageSize = 100
	case pageSize <= 0:
		pageSize = 10
	}

	if pageNum == 0 {
		pageNum = 1
	}

	data, total := model.GetCate(pageSize, pageNum)
	code := weberr.SUCCESS
	c.JSON(
		http.StatusOK, gin.H{
			"status":  code,
			"data":    data,
			"total":   total,
			"message": weberr.GetErr(code),
		},
	)
}

// GetCateInfo 查询分类信息
func GetCateInfo(c *gin.Context) {
	data, code := model.GetCateInfo(c.Param("name"))

	c.JSON(
		http.StatusOK, gin.H{
			"status":  code,
			"data":    data,
			"message": weberr.GetErr(code),
		},
	)

}

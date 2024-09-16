package controller

import (
	"backend/model"
	"net/http"

	"github.com/gin-gonic/gin"
)

func CreatePost(c *gin.Context) {
	var post model.Post

	if err := c.ShouldBindJSON(&post); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := post.CreatePost(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "register success",
		"data":    post,
	})
}

func GetPosts(c *gin.Context) {
	var postInstance model.Post
	if posts, err := postInstance.GetPosts(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	} else {

		c.JSON(http.StatusOK, gin.H{
			"message": "get post success",
			"data":    posts,
		})
	}
}

func GetPostById(c *gin.Context) {
	var postInstance model.Post
	postId := c.Param("id")
	if post, err := postInstance.GetPostById(postId); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	} else {
		c.JSON(http.StatusOK, gin.H{
			"message": "get post success",
			"data":    post,
		})
	}
}

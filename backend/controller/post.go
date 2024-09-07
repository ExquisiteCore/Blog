package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func Post(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{})
}

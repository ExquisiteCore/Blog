package routes

import (
	"backend/config"

	"github.com/gin-gonic/gin"
)

func StartRuter() *gin.Engine {
	gin.SetMode(config.GlobalConfig.Server.AppMode)

	r := gin.Default()
	api := r.Group("/api")
	{
		api.GET("/test", func(ctx *gin.Context) { ctx.JSON(200, gin.H{"message": "Hello World!"}) })
		//api.GET("/post", controller.Post)
	}
	return r
}

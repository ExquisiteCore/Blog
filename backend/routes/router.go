package routes

import (
	"backend/config"
	"backend/controller"
	"backend/middlewares"

	"github.com/gin-gonic/gin"
)

func StartRuter() *gin.Engine {
	gin.SetMode(config.GlobalConfig.Server.AppMode)

	r := gin.Default()
	public := r.Group("/api")
	{
		public.GET("/ping", Ping)
		//auth
		public.POST("/auth/login", controller.Login)
		public.POST("/auth/register", controller.Register)
	}
	private := r.Group("/api")
	{
		private.Use(middlewares.JwtAuthMiddleware())
		private.GET("/user/currentUser", controller.CurrentUser)
	}
	return r
}

// @Description	do ping
// @Tags			api
// @Accept			json
// @Produce		json
// @Success		200	{string}	Helloworld
// @Router			/api/ping [get]
func Ping(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "pong",
	})
}

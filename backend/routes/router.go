package routes

import (
	"backend/config"
	"backend/controller"
	"backend/middlewares"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func StartRuter() *gin.Engine {
	gin.SetMode(config.GlobalConfig.Server.AppMode)

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},                   // 允许的源
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}, // 允许的请求方法
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"}, // 允许的请求头
		ExposeHeaders:    []string{"Content-Length"},                          // 允许暴露的响应头
		AllowCredentials: true,                                                // 是否允许凭证
	}))
	public := r.Group("/api")
	{
		public.GET("/ping", Ping)
		//auth
		public.POST("/auth/login", controller.Login)
		public.POST("/auth/register", controller.Register)
		//Post
		public.GET("/post/posts", controller.GetPosts)
		public.GET("/post/:id", controller.GetPostById)
	}
	private := r.Group("/api")
	{
		private.Use(middlewares.JwtAuthMiddleware())
		private.GET("/user/currentUser", controller.CurrentUser)
		//Post
		private.POST("/post/create", controller.CreatePost)
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

package routes

import (
	"backend/api"
	"backend/config"
	"backend/middleware"

	"github.com/gin-gonic/gin"
)

func InitRuter() {
	gin.SetMode(config.GlobalConfig.Server.AppMode)

	r := gin.Default()

	r.Use(middleware.Cors())

	authrouter := r.Group("/api")
	{
		authrouter.Use(middleware.JwtToken())
		//User路由
		user := authrouter.Group("/user")
		{
			user.DELETE("/delete/:name", api.DeleteUser)
		}
		//Post路由
		Post := authrouter.Group("/post")
		{
			Post.POST("/add", api.AddPost)
			Post.DELETE("/delete/:id", api.DeletePost)
		}
		//Category路由
		Category := authrouter.Group("/category")
		{
			Category.POST("/add", api.AddCategory)
			Category.DELETE("/delete/:name", api.DeleteCategory)
		}
	}
	public := r.Group("/api")
	{
		public.POST("/user/add", api.AddUser)
		public.POST("/login", api.Login)
		//Post路由
		Post := public.Group("/post")
		{
			Post.GET("/get", api.GetPost)
			Post.GET("/get/:id", api.GetPostInfo)
		}
		//Category路由
		Category := public.Group("/category")
		{
			Category.GET("/get", api.GetCate)
			Category.GET("/get/:name", api.GetCateInfo)
		}
	}

	r.Run(config.GlobalConfig.Server.HttpPort)
}

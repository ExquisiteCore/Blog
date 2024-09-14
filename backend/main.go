package main

import (
	"backend/config"
	"backend/model"
	"backend/routes"
)

func init() {
	config.Init()  //配置文件初始化
	model.InitDb() //数据库初始化
}

//	@title			Blog API
//	@version		1.0.0
//	@description	This is a sample server Blog API.
//	@host			127.0.0.1:8000
//	@BasePath		/api

// @securityDefinitions.apikey	ApiKeyAuth
// @in							header
// @name						Authorization
// @description				Type "Bearer" followed by a space and JWT token.
func main() {
	r := routes.StartRuter()
	routes.InitSwaggerRouter(r)
	r.Run(config.GlobalConfig.Server.HttpPort)
}

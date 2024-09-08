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

func main() {
	r := routes.StartRuter()

	r.Run(config.GlobalConfig.Server.HttpPort)
}

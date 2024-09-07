package main

import (
	"backend/config"
	"backend/routes"
)

func init() {
	config.Init() //配置文件初始化
}

func main() {
	r := routes.StartRuter()

	r.Run(config.GlobalConfig.Server.HttpPort)
}

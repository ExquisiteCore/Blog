package config

import (
	"github.com/BurntSushi/toml"
	"github.com/sirupsen/logrus"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Qiniu    QiniuConfig
}

type ServerConfig struct {
	AppMode  string
	HttpPort string
	JwtKey   string
}

type DatabaseConfig struct {
	Db         string
	DbHost     string
	DbPort     int
	DbUser     string
	DbPassWord string
	DbName     string
}

type QiniuConfig struct {
	Zone       int
	AccessKey  string
	SecretKey  string
	Bucket     string
	QiniuSever string
}

// GlobalConfig 默认全局配置
var GlobalConfig *Config

// Init 使用 ./config.toml 初始化全局配置
func Init() {
	GlobalConfig = &Config{}
	_, err := toml.DecodeFile("config.toml", GlobalConfig)
	if err != nil {
		logrus.WithField("config", "GlobalConfig").WithError(err).Panicf("unable to read global config")
	}
}

// InitWithContent 从字节数组中读取配置内容
func InitWithContent(configTOMLContent []byte) {
	_, err := toml.Decode(string(configTOMLContent), GlobalConfig)
	if err != nil {
		panic(err)
	}
}

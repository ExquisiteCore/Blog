package model

import (
	"backend/config"
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var db *gorm.DB

func InitDb() {
	dbConfig := config.GlobalConfig.Database

	dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		dbConfig.DbHost, dbConfig.DbPort, dbConfig.DbUser, dbConfig.DbPassWord, dbConfig.DbName)

	var err error
	db, err = gorm.Open(postgres.Open(dsn))
	if err != nil {
		panic("failed to connect database")
	}
	err = db.AutoMigrate(&User{}, &Post{})
	if err != nil {
		log.Fatalf("failed to auto-migrate: %v", err)
	}
}

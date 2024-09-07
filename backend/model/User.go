package model

import (
	"backend/weberr"
	"errors"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Username string `gorm:"type:varchar(20);not null" json:"username"`
	Password string `gorm:"type:varchar(20);not null" json:"password"`
	Role     int    `gorm:"type:int" json:"role"`
}

// 添加用户
func CreateUser(data *User) int {
	if db == nil {
		logrus.Errorln("Database instance is nil")
		return weberr.INTERNAL_SERVER_ERROR
	}
	err := db.Create(&data).Error
	if err != nil {
		return weberr.INTERNAL_SERVER_ERROR
	}
	return weberr.SUCCESS
}

// 查询用户是否存在
func CheckUserExists(username string) int {
	var count int64
	if db == nil {
		logrus.Errorln("Database instance is nil")
		return weberr.INTERNAL_SERVER_ERROR
	}
	db.Model(&User{}).Where("username = ?", username).Count(&count)
	if count > 0 {
		return weberr.USER_ALREADY_EXISTS // 用户已存在
	}
	return weberr.USER_NOT_FOUND // 用户不存在
}

// DeleteUser 删除用户
func DeleteUser(name string) int {
	if db == nil {
		logrus.Error("Database instance is nil")
		return weberr.INTERNAL_SERVER_ERROR
	}
	err := db.Where("username = ? ", name).Unscoped().Delete(&User{}).Error
	//err := db.Delete(&User{}, id).Error
	if err != nil {
		//logrus.Errorf("Failed to delete user with ID %d: %v", name, err)
		return weberr.INTERNAL_SERVER_ERROR
	}

	return weberr.SUCCESS
}

// CheckLogin 后台登录验证
// func CheckLogin(username string, password string) (User, int) {
// 	var user User
// 	var PasswordErr error

// 	db.Where("username = ?", username).First(&user)

// 	PasswordErr = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))

// 	if user.ID == 0 {
// 		return user, errmsg.ERROR_USER_NOT_EXIST
// 	}
// 	if PasswordErr != nil {
// 		return user, errmsg.ERROR_PASSWORD_WRONG
// 	}
// 	if user.Role != 1 {
// 		return user, errmsg.ERROR_USER_NO_RIGHT
// 	}
// 	return user, errmsg.SUCCESS
// }

// CheckLoginFront 前台登录
func CheckLoginFront(username string, password string) (User, int) {
	var user User

	db.Where("username = ?", username).First(&user)

	//PasswordErr = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	err := ComparePasswords(user.Password, password)
	if user.ID == 0 {
		return user, weberr.USER_NOT_FOUND
	}
	if err != nil {
		return user, weberr.INVALID_PASSWORD
	}
	return user, weberr.SUCCESS
}

func ComparePasswords(storedPassword, inputPassword string) error {
	if storedPassword == inputPassword {
		return nil
	}
	return ErrWrongPassword
}

var (
	ErrWrongPassword = errors.New("密码错误。")
)

package model

import (
	"errors"
	"html"
	"strings"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Username string `gorm:"uniqueIndex;not null" json:"username"`
	Password string `gorm:"not null" json:"password"`
	Role     int    `gorm:"type:int;not null" json:"role"`
}

func (u *User) SaveUser() (*User, error) {
	err := db.Create(&u).Error
	if err != nil {
		return &User{}, err
	}
	return u, nil
}

// 使用gorm的hook在保存密码前对密码进行hash
func (u *User) BeforeSave(tx *gorm.DB) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashedPassword)
	u.Username = html.EscapeString(strings.TrimSpace(u.Username))
	return nil
}

func VerifyPassword(password, hashedPassword string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}

func LoginCheck(username, password string) (string, error) {
	var err error
	u := User{}

	err = db.Model(User{}).Where("username = ?", username).Take(&u).Error
	if err != nil {
		return "", err
	}
	err = VerifyPassword(password, u.Password)
	if err != nil && err == bcrypt.ErrMismatchedHashAndPassword {
		return "", err
	}

	token, err := GenerateToken(u.ID)
	if err != nil {
		return "", err
	}
	return token, nil
}

// 返回前将用户密码置空
func (u *User) PrepareGive() {
	u.Password = ""
}

func GetUserByID(uid uint) (User, error) {
	var u User
	if err := db.First(&u, uid).Error; err != nil {
		return u, errors.New("user not found")
	}

	u.PrepareGive()
	return u, nil
}

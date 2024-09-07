package model

import (
	"backend/weberr"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type Category struct {
	ID   uint   `gorm:"primary_key;auto_increment" json:"id"`
	Name string `gorm:"type:varchar(20);not null" json:"name"`
}

// 添加分类
func CreateCategory(data *Category) int {
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

// 查询分类是否存在
func CheckCategoryExists(name string) int {
	var count int64
	if db == nil {
		logrus.Errorln("Database instance is nil")
		return weberr.INTERNAL_SERVER_ERROR
	}
	db.Model(&Category{}).Where("name = ?", name).Count(&count)
	if count > 0 {
		return weberr.CATEGORY_ALREADY_EXISTS // 分类已存在
	}
	return weberr.CATEGORY_NOT_FOUND // 分类不存在
}

// 删除分类
func DeleteCategory(name string) int {
	if db == nil {
		logrus.Error("Database instance is nil")
		return weberr.INTERNAL_SERVER_ERROR
	}
	err := db.Where("name = ? ", name).Delete(&Category{}).Error
	if err != nil {
		return weberr.INTERNAL_SERVER_ERROR
	}

	return weberr.SUCCESS
}

// 查询单个分类信息
func GetCateInfo(name string) (Category, int) {
	var cate Category
	db.Where("name = ?", name).First(&cate)
	return cate, weberr.SUCCESS
}

// 查询分类列表
func GetCate(pageSize int, pageNum int) ([]Category, int64) {
	var cate []Category
	var total int64
	err := db.Find(&cate).Limit(pageSize).Offset((pageNum - 1) * pageSize).Error
	db.Model(&cate).Count(&total)
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, 0
	}
	return cate, total
}

// 查询分类下的文章
func GetCategory() {
}

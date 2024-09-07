package model

import (
	"backend/weberr"

	"gorm.io/gorm"
)

type Post struct {
	gorm.Model
	Category Category `gorm:"foreignkey:Cid"`
	Title    string   `gorm:"type:varchar(100);not null" json:"title"`
	Desc     string   `gorm:"type:varchar(200)" json:"desc"`
	Content  string   `gorm:"type:TEXT" json:"content"`
	Img      string   `gorm:"type:varchar(100)" json:"img"`
	Cid      int64    `gorm:"type:int;not null" json:"cid"`
}

// CreatePost 新增文章
func CreatePost(data *Post) int {
	err := db.Create(&data).Error
	if err != nil {
		return weberr.INTERNAL_SERVER_ERROR
	}
	return weberr.SUCCESS
}

// GetPostInfo 查询单个文章
func GetPostInfo(id int) (Post, int) {
	var Post Post
	err := db.Where("id = ?", id).Preload("Category").First(&Post).Error
	db.Model(&Post).Where("id = ?", id).UpdateColumn("read_count", gorm.Expr("read_count + ?", 1))
	if err != nil {
		return Post, weberr.INTERNAL_SERVER_ERROR
	}
	return Post, weberr.SUCCESS
}

// 查询分类下的所有文章
func GetCatePost(id int, pageSize int, pageNum int) ([]Post, int, int64) {
	var cateArtList []Post
	var total int64

	err := db.Preload("Category").Limit(pageSize).Offset((pageNum-1)*pageSize).Where(
		"cid =?", id).Find(&cateArtList).Error
	db.Model(&cateArtList).Where("cid =?", id).Count(&total)
	if err != nil {
		return nil, weberr.INTERNAL_SERVER_ERROR, 0
	}
	return cateArtList, weberr.SUCCESS, total
}

// GetPost 查询文章列表
func GetPost(pageSize int, pageNum int) ([]Post, int, int64) {
	var PosticleList []Post
	var err error
	var total int64

	err = db.Select("Posticle.id, title, img, created_at, updated_at, `desc`, comment_count, read_count, category.name").Limit(pageSize).Offset((pageNum - 1) * pageSize).Order("Created_At DESC").Joins("Category").Find(&PosticleList).Error
	// 单独计数
	db.Model(&PosticleList).Count(&total)
	if err != nil {
		return nil, weberr.INTERNAL_SERVER_ERROR, 0
	}
	return PosticleList, weberr.SUCCESS, total

}

// SearchPosticle 搜索文章标题
func SearchPosticle(title string, pageSize int, pageNum int) ([]Post, int, int64) {
	var PosticleList []Post
	var err error
	var total int64
	err = db.Select("Posticle.id,title, img, created_at, updated_at, `desc`, comment_count, read_count, Category.name").Order("Created_At DESC").Joins("Category").Where("title LIKE ?",
		title+"%",
	).Limit(pageSize).Offset((pageNum - 1) * pageSize).Find(&PosticleList).Error
	//单独计数
	db.Model(&PosticleList).Where("title LIKE ?",
		title+"%",
	).Count(&total)

	if err != nil {
		return nil, weberr.INTERNAL_SERVER_ERROR, 0
	}
	return PosticleList, weberr.SUCCESS, total
}

// DeletePost 删除文章
func DeletePost(id int) int {
	var Post Post
	err := db.Where("id = ? ", id).Delete(&Post).Error
	if err != nil {
		return weberr.INTERNAL_SERVER_ERROR
	}
	return weberr.SUCCESS
}

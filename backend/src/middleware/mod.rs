//! 中间件模块
//!
//! 这个模块包含所有的中间件
//!
pub mod auth;
pub mod cors;
pub mod trace_layer;
// use std::boxed::Box;
// use tower::Layer;
// use tower::ServiceBuilder;

// pub fn create_layer() -> Box<dyn Layer<S> {
//     Box::new(
//         ServiceBuilder::new()
//             .layer(cors::create_layer())
//             .layer(trace_layer::create_layer())
//             .into_inner(),
//     )
// }
